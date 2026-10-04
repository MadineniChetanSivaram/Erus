import { useState, useEffect, useRef, useCallback } from 'react';

// Detect best supported MIME type for MediaRecorder across modern browsers
export function getBestSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export interface UploadRecordingResponse {
  success: boolean;
  slotId?: string;
  recordingUrl?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  recordedAt?: string;
  error?: string;
}

/**
 * Upload a recorded GD audio/video Blob directly to the backend storage endpoint.
 */
export async function uploadGDRecording(
  slotId: string,
  blob: Blob,
  durationSeconds: number = 0,
  recordedBy?: string
): Promise<UploadRecordingResponse> {
  if (!slotId) throw new Error('slotId is required to upload GD recording');
  if (!blob || blob.size === 0) throw new Error('Recording blob is empty');

  const headers: Record<string, string> = {
    'Content-Type': blob.type || 'audio/webm',
    'x-recording-duration': String(durationSeconds || 0),
  };
  if (recordedBy) {
    headers['x-recorded-by'] = recordedBy;
  }

  const res = await fetch(`/api/sessions/${encodeURIComponent(slotId)}/recording?duration=${durationSeconds}`, {
    method: 'POST',
    headers,
    body: blob,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to upload recording (HTTP ${res.status})`);
  }

  return data;
}

/**
 * Trigger an instant browser file download of the recorded audio/video blob.
 */
export function downloadRecordingLocally(blob: Blob, filename?: string) {
  if (typeof window === 'undefined' || !blob) return;
  const isVideo = blob.type.includes('video');
  const ext = isVideo ? 'webm' : (blob.type.includes('ogg') ? 'ogg' : (blob.type.includes('mp4') ? 'mp4' : 'webm'));
  const safeFilename = filename || `ERUS-GD-Recording-${Date.now()}.${ext}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export interface UseGDRecorderOptions {
  slotId: string;
  isSessionActive: boolean;
  localStream?: MediaStream | null;
  peerStreams?: Map<string, MediaStream>;
  autoStartOnActive?: boolean;
  onRecordingComplete?: (recordingUrl: string, blob: Blob) => void;
}

export interface UseGDRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingDurationSeconds: number;
  formattedDuration: string;
  recordingUrl: string | null;
  recordingBlob: Blob | null;
  isUploading: boolean;
  uploadSuccess: boolean;
  uploadError: string | null;
  startRecording: () => Promise<boolean>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  stopAndUploadRecording: (overrideSlotId?: string) => Promise<UploadRecordingResponse | null>;
  downloadLocalCopy: (filename?: string) => void;
}

/**
 * Unified React hook for recording live Group Discussion audio & peer discussions,
 * managing Web Audio stream mixing, duration timer, and automated cloud upload.
 */
export function useGDRecorder({
  slotId,
  isSessionActive,
  localStream,
  peerStreams,
  autoStartOnActive = true,
  onRecordingComplete,
}: UseGDRecorderOptions): UseGDRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const connectedTracksRef = useRef<Set<string>>(new Set());
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationCounterRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>('');

  // Format seconds to mm:ss or hh:mm:ss
  const formattedDuration = `${Math.floor(recordingDurationSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(recordingDurationSeconds % 60).toString().padStart(2, '0')}`;

  // Helper to connect an audio stream to the mixer destination node
  const mixStreamIntoDestination = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current || !destinationRef.current) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    for (const track of audioTracks) {
      if (connectedTracksRef.current.has(track.id)) continue;
      try {
        const singleStream = new MediaStream([track]);
        const source = audioContextRef.current.createMediaStreamSource(singleStream);
        source.connect(destinationRef.current);
        connectedTracksRef.current.add(track.id);

        track.onended = () => {
          connectedTracksRef.current.delete(track.id);
        };
      } catch (err) {
        console.warn('[GD Recorder] Failed to connect track to mixer:', track.id, err);
      }
    }
  }, []);

  // Update mixer whenever local stream or peer streams arrive/change
  useEffect(() => {
    if (!isRecording) return;
    if (localStream) {
      mixStreamIntoDestination(localStream);
    }
    if (peerStreams) {
      for (const peerStream of peerStreams.values()) {
        mixStreamIntoDestination(peerStream);
      }
    }
  }, [isRecording, localStream, peerStreams, mixStreamIntoDestination]);

  // Start recording
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return true; // Already recording
    }

    try {
      chunksRef.current = [];
      durationCounterRef.current = 0;
      setRecordingDurationSeconds(0);
      setRecordingBlob(null);
      setRecordingUrl(null);
      setUploadSuccess(false);
      setUploadError(null);

      // 1. Setup AudioContext & Destination
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;
      const dest = ctx.createMediaStreamDestination();
      destinationRef.current = dest;
      connectedTracksRef.current.clear();

      // 2. Mix available streams (local user + peers)
      if (localStream && localStream.getAudioTracks().length > 0) {
        mixStreamIntoDestination(localStream);
      } else {
        // Fallback: request microphone for recording
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          mixStreamIntoDestination(mic);
        } catch (micErr) {
          console.warn('[GD Recorder] Mic stream fallback skipped:', micErr);
        }
      }

      if (peerStreams) {
        for (const peerStream of peerStreams.values()) {
          mixStreamIntoDestination(peerStream);
        }
      }

      // If no tracks connected yet, create an oscillator silence track so MediaRecorder doesn't error
      if (connectedTracksRef.current.size === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0; // silent
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
      }

      const mixedStream = dest.stream;
      const bestMime = getBestSupportedAudioMimeType();
      mimeTypeRef.current = bestMime;

      const recorderOptions: MediaRecorderOptions = bestMime ? { mimeType: bestMime } : {};
      const recorder = new MediaRecorder(mixedStream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        const mime = mimeTypeRef.current || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mime });
        setRecordingBlob(finalBlob);

        const localUrl = URL.createObjectURL(finalBlob);
        setRecordingUrl(localUrl);
        setIsRecording(false);
        setIsPaused(false);

        if (onRecordingComplete) {
          onRecordingComplete(localUrl, finalBlob);
        }

        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
          destinationRef.current = null;
          connectedTracksRef.current.clear();
        }
      };

      // Collect data every 1000ms
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      // Start duration timer
      timerIntervalRef.current = setInterval(() => {
        durationCounterRef.current += 1;
        setRecordingDurationSeconds(durationCounterRef.current);
      }, 1000);

      console.log(`[GD Recorder] Discussion recording started (format: ${bestMime || 'default'})`);
      return true;
    } catch (err: any) {
      console.error('[GD Recorder] Failed to start MediaRecorder:', err);
      setIsRecording(false);
      return false;
    }
  }, [localStream, peerStreams, mixStreamIntoDestination, onRecordingComplete]);

  // Pause
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);

  // Resume
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        durationCounterRef.current += 1;
        setRecordingDurationSeconds(durationCounterRef.current);
      }, 1000);
    }
  }, []);

  // Stop recording and return final Blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const rec = mediaRecorderRef.current;
      if (!rec || rec.state === 'inactive') {
        resolve(recordingBlob);
        return;
      }

      const handleStop = () => {
        rec.removeEventListener('stop', handleStop);
        const mime = mimeTypeRef.current || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mime });
        resolve(finalBlob);
      };

      rec.addEventListener('stop', handleStop);
      try {
        rec.stop();
      } catch {
        resolve(null);
      }
    });
  }, [recordingBlob]);

  // Stop and automatically upload recording to server
  const stopAndUploadRecording = useCallback(
    async (overrideSlotId?: string): Promise<UploadRecordingResponse | null> => {
      const targetSlot = overrideSlotId || slotId;
      if (!targetSlot) return null;

      setIsUploading(true);
      setUploadError(null);

      try {
        const finalBlob = await stopRecording();
        if (!finalBlob || finalBlob.size === 0) {
          console.warn('[GD Recorder] No audio chunks captured to upload');
          setIsUploading(false);
          return null;
        }

        const duration = durationCounterRef.current || recordingDurationSeconds;
        const uploadResult = await uploadGDRecording(targetSlot, finalBlob, duration);

        setIsUploading(false);
        setUploadSuccess(true);
        if (uploadResult.recordingUrl) {
          setRecordingUrl(uploadResult.recordingUrl);
        }
        return uploadResult;
      } catch (err: any) {
        console.error('[GD Recorder] Error uploading session recording:', err);
        setIsUploading(false);
        setUploadError(err.message || 'Upload failed');
        return null;
      }
    },
    [slotId, stopRecording, recordingDurationSeconds]
  );

  // Download local copy
  const downloadLocalCopy = useCallback(
    (filename?: string) => {
      if (recordingBlob) {
        downloadRecordingLocally(recordingBlob, filename || `GD-${slotId}-${Date.now()}.webm`);
      } else if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' });
        downloadRecordingLocally(blob, filename || `GD-${slotId}-${Date.now()}.webm`);
      }
    },
    [recordingBlob, slotId]
  );

  // Auto-start recording when session becomes active (if autoStartOnActive is true)
  useEffect(() => {
    if (autoStartOnActive && isSessionActive && !isRecording && !recordingUrl) {
      startRecording();
    }
  }, [autoStartOnActive, isSessionActive, isRecording, recordingUrl, startRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    recordingDurationSeconds,
    formattedDuration,
    recordingUrl,
    recordingBlob,
    isUploading,
    uploadSuccess,
    uploadError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    stopAndUploadRecording,
    downloadLocalCopy,
  };
}
