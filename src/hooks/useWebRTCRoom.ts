import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthUser } from '../types/auth';
import { GDTranscript } from '../types/gd';

export interface LivePeer {
  socketId: string;
  userId: string;
  name: string;
  avatar: string;
  role: string;
  college: string;
  seatNumber: number;
  isSpeaking: boolean;
  micActive: boolean;
  cameraActive: boolean;
  speakingDurationSeconds: number;
  speakingTurns: number;
  volumeLevel?: number;
}

interface UseWebRTCRoomOptions {
  slotId: string;
  currentUser: AuthUser | null;
  onNewTranscript?: (transcript: GDTranscript) => void;
  onFacilitatorIntervention?: (intervention: { text: string; action: string; transcript: GDTranscript }) => void;
  onSessionStarted?: (data: any) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTCRoom({
  slotId,
  currentUser,
  onNewTranscript,
  onFacilitatorIntervention,
  onSessionStarted,
}: UseWebRTCRoomOptions) {
  const [connected, setConnected] = useState(false);
  const [assignedSeat, setAssignedSeat] = useState<number>(currentUser && 'seatNumber' in currentUser ? (currentUser as any).seatNumber || 1 : 1);
  const [peers, setPeers] = useState<LivePeer[]>([]);
  const [silenceTimerSeconds, setSilenceTimerSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakingLive, setIsSpeakingLive] = useState(false);
  const [localVolume, setLocalVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerCounterRef = useRef<number>(0);
  const speakingStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Play incoming peer audio stream through browser speakers
  const attachRemoteAudio = useCallback((peerSocketId: string, stream: MediaStream) => {
    let audioEl = audioElementsRef.current.get(peerSocketId);
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.id = `remote-audio-${peerSocketId}`;
      audioEl.autoplay = true;
      (audioEl as any).playsInline = true;
      document.body.appendChild(audioEl);
      audioElementsRef.current.set(peerSocketId, audioEl);
    }
    audioEl.srcObject = stream;
    audioEl.play().catch((e) => console.warn('[WebRTC Audio Playback Note]:', e));
  }, []);

  // 2. Remove peer audio element on disconnect
  const detachRemoteAudio = useCallback((peerSocketId: string) => {
    const audioEl = audioElementsRef.current.get(peerSocketId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
      audioElementsRef.current.delete(peerSocketId);
    }
  }, []);

  // 3. Create or get RTCPeerConnection for a specific peer
  const getOrCreatePeerConnection = useCallback((peerSocketId: string): RTCPeerConnection => {
    let pc = peerConnectionsRef.current.get(peerSocketId);
    if (pc && pc.signalingState !== 'closed') {
      return pc;
    }

    pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerSocketId, pc);

    // Add local microphone audio track to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc?.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate exchange
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal-send', {
          to: peerSocketId,
          signal: { candidate: event.candidate },
        });
      }
    };

    // When remote audio track is received from peer, stream it to speakers
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        attachRemoteAudio(peerSocketId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc?.connectionState === 'failed' || pc?.connectionState === 'closed') {
        detachRemoteAudio(peerSocketId);
        peerConnectionsRef.current.delete(peerSocketId);
      }
    };

    return pc;
  }, [attachRemoteAudio, detachRemoteAudio]);

  // 4. Initialize Local Microphone & Real-time Volume Analyzer
  const initLocalMicrophone = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;

      // Setup Web Audio Analyser for speaking detection & audio visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setLocalVolume(Math.min(100, Math.round((avg / 128) * 100)));

          // Detect speaking when volume exceeds threshold (value > 12)
          const speakingNow = avg > 12 && !isMicMuted;
          setIsSpeakingLive(speakingNow);

          if (speakingNow) {
            if (speakingStateTimeoutRef.current) {
              clearTimeout(speakingStateTimeoutRef.current);
              speakingStateTimeoutRef.current = null;
            }
            if (socketRef.current) {
              socketRef.current.emit('peer-speaking-state', {
                slotId,
                isSpeaking: true,
                micActive: !isMicMuted,
                volumeLevel: Math.round(avg),
              });
            }
          } else {
            if (!speakingStateTimeoutRef.current && socketRef.current) {
              speakingStateTimeoutRef.current = setTimeout(() => {
                socketRef.current?.emit('peer-speaking-state', {
                  slotId,
                  isSpeaking: false,
                  micActive: !isMicMuted,
                  volumeLevel: 0,
                });
                speakingStateTimeoutRef.current = null;
              }, 600);
            }
          }

          animFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      }

      return stream;
    } catch (err: any) {
      console.warn('[Microphone init note]:', err.message);
      setError(err.message || 'Microphone access denied or unavailable.');
      return null;
    }
  }, [slotId, isMicMuted]);

  // 5. Connect to Socket.IO Server & Room Signaling
  useEffect(() => {
    let active = true;

    // Connect socket (relative origin works seamlessly on both localhost and Railway)
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', async () => {
      if (!active) return;
      setConnected(true);

      // Acquire microphone
      await initLocalMicrophone();

      // Join the slot room with user metadata
      socket.emit('join-gd-room', {
        slotId,
        user: {
          id: currentUser?.id || `anon-${socket.id}`,
          name: currentUser?.name || 'Student Participant',
          avatar: currentUser?.avatar || '',
          role: currentUser?.role || 'student',
          college: currentUser?.college || 'Campus Participant',
          seatNumber: currentUser && 'seatNumber' in currentUser ? (currentUser as any).seatNumber : undefined,
        },
      });
    });

    // Received initial room state
    socket.on('gd-room-joined', async ({ assignedSeat: mySeat, peers: existingPeers, silenceTimerSeconds: initialSilence }) => {
      if (!active) return;
      setAssignedSeat(mySeat);
      setPeers(existingPeers || []);
      setSilenceTimerSeconds(initialSilence || 0);

      // Initiate WebRTC offers to all peers already in the room
      if (existingPeers && existingPeers.length > 0) {
        for (const remotePeer of existingPeers) {
          try {
            const pc = getOrCreatePeerConnection(remotePeer.socketId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal-send', {
              to: remotePeer.socketId,
              signal: { sdp: offer },
            });
          } catch (e) {
            console.warn('[WebRTC createOffer error]:', e);
          }
        }
      }
    });

    // A new peer joined the room
    socket.on('peer-joined', ({ peer }) => {
      if (!active) return;
      setPeers((prev) => {
        const filtered = prev.filter((p) => p.socketId !== peer.socketId);
        return [...filtered, peer];
      });
      // Prepare peer connection for incoming offer from newly joined peer
      getOrCreatePeerConnection(peer.socketId);
    });

    // WebRTC Signaling Relay Received (Offer, Answer, ICE Candidate)
    socket.on('signal-receive', async ({ from, signal }) => {
      if (!active) return;
      const pc = getOrCreatePeerConnection(from);

      try {
        if (signal.sdp) {
          if (signal.sdp.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal-send', {
              to: from,
              signal: { sdp: answer },
            });
          } else if (signal.sdp.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (e) {
        console.warn('[WebRTC Signaling error]:', e);
      }
    });

    // A peer updated speaking/mic/camera state
    socket.on('peer-speaking-updated', ({ socketId: peerSockId, isSpeaking, micActive, cameraActive, volumeLevel: peerVol }) => {
      if (!active) return;
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === peerSockId
            ? { ...p, isSpeaking, micActive: micActive ?? p.micActive, cameraActive: cameraActive ?? p.cameraActive, volumeLevel: peerVol }
            : p
        )
      );
    });

    // A peer disconnected from the slot
    socket.on('peer-left', ({ socketId: leftSockId }) => {
      if (!active) return;
      detachRemoteAudio(leftSockId);
      const pc = peerConnectionsRef.current.get(leftSockId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(leftSockId);
      }
      setPeers((prev) => prev.filter((p) => p.socketId !== leftSockId));
    });

    // 20-Second Silence Deadlock Countdown Tick
    socket.on('silence-timer-tick', ({ silenceTimerSeconds: tickSec }) => {
      if (!active) return;
      setSilenceTimerSeconds(tickSec);
      silenceTimerCounterRef.current = tickSec;
    });

    // Synchronized Live Transcript Chunk Broadcast
    socket.on('new-transcript', ({ transcript }) => {
      if (!active) return;
      if (onNewTranscript) {
        onNewTranscript(transcript);
      }
    });

    // AI Facilitator Autonomous Intervention (Deadlock question or dominance nudge)
    socket.on('facilitator-intervention', (intervention) => {
      if (!active) return;
      if (onFacilitatorIntervention) {
        onFacilitatorIntervention(intervention);
      }
    });

    // Faculty Commences Session Broadcast
    socket.on('session-started', (data) => {
      if (!active) return;
      if (onSessionStarted) {
        onSessionStarted(data);
      }
    });

    socket.on('disconnect', () => {
      if (!active) return;
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (speakingStateTimeoutRef.current) clearTimeout(speakingStateTimeoutRef.current);

      // Stop local microphone
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();

      // Remove audio playback elements
      audioElementsRef.current.forEach((el) => {
        el.pause();
        el.srcObject = null;
        el.remove();
      });
      audioElementsRef.current.clear();

      socket.disconnect();
    };
  }, [slotId, currentUser, initLocalMicrophone, getOrCreatePeerConnection, detachRemoteAudio, onNewTranscript, onFacilitatorIntervention, onSessionStarted]);

  // Toggle local microphone mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextMuted = audioTrack.enabled; // If enabled, toggles to muted (disabled)
        audioTrack.enabled = !nextMuted;
        setIsMicMuted(!nextMuted);

        if (socketRef.current) {
          socketRef.current.emit('peer-speaking-state', {
            slotId,
            isSpeaking: false,
            micActive: !nextMuted,
            volumeLevel: 0,
          });
        }
      }
    }
  }, [slotId]);

  // Broadcast spoken transcript to all room members
  const broadcastTranscript = useCallback((text: string, elapsedSeconds: number) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit('peer-transcript', {
        slotId,
        text: text.trim(),
        elapsedSeconds,
      });
    }
  }, [slotId]);

  // Start GD Session (emits start-session to server)
  const startSession = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('start-session', { slotId });
    }
  }, [slotId]);

  return {
    connected,
    assignedSeat,
    peers,
    silenceTimerSeconds,
    isMicMuted,
    isSpeakingLive,
    localVolume,
    toggleMute,
    broadcastTranscript,
    startSession,
    error,
  };
}
