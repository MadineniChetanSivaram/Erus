/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header, NavTabType } from './components/Header';
import { RealisticGDRoom } from './components/GDRoom/RealisticGDRoom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StudentReportView } from './components/AssessmentReport/StudentReportView';
import { FacultyDashboardView } from './components/FacultyDashboard/FacultyDashboardView';
import { CollegeAdminDashboard } from './components/CollegeAdmin/CollegeAdminDashboard';
import { SuperAdminDashboard } from './components/SuperAdmin/SuperAdminDashboard';
import { SessionCreationModal } from './components/SessionManager/SessionCreationModal';
import { AuthPortal } from './components/Auth/AuthPortal';
import { GDSession, Student, TranscriptEntry, StudentAssessmentReport } from './types/gd';
import { AuthUser } from './types/auth';
import { 
  INITIAL_SESSION, 
  INITIAL_SLOTS, 
  INITIAL_TRANSCRIPTS, 
  SAMPLE_REPORT_RAHUL,
  generateStudentReport,
  generateSlotParticipants 
} from './data/mockGDData';
import { addReportToStudentHistory } from './utils/studentReportHistory';
import { facilitatorVoice } from './utils/speechSynthesis';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { getNextUniqueFacilitatorPrompt, sessionQuestionTracker } from './utils/facilitatorQuestionEngine';
import { clearStoredAuth, verifyCurrentSession, createCollegeSlot } from './utils/authApi';
import { 
  getStudentBookedSlotsByTopic,
  setStudentBookedSlotForTopic,
  clearStudentBookedSlotForTopic,
  getStudentBookedSlotId, 
  isSlotSelectableForTopic,
  checkCanReviveSlot 
} from './utils/studentBooking';
import { StudentTopicPortal } from './components/StudentPortal/StudentTopicPortal';

function GDAppContent() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('erus_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const STORAGE_KEY = 'erus_available_slots_v9';

  // Safely load and validate slots, purging stale legacy storage where all slots were full or active
  const loadInitialSlots = (): GDSession[] => {
    try {
      // Purge older legacy cache keys
      ['erus_available_slots', 'erus_available_slots_v1', 'erus_available_slots_v2', 'erus_available_slots_v3', 'erus_available_slots_v4', 'erus_available_slots_v5', 'erus_available_slots_v6', 'erus_available_slots_v7', 'erus_available_slots_v8'].forEach((k) => {
        localStorage.removeItem(k);
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if every slot in storage is marked full (15/15) - if so, discard stale cache
          const allFull = parsed.every((s: GDSession) => {
            const maxCap = s.maxCapacity || 15;
            const enrolled = s.enrolledCount ?? s.students?.length ?? 15;
            return enrolled >= maxCap;
          });
          if (!allFull) {
            return parsed.map((s: GDSession) => ({
              ...s,
              status: s.status === 'completed' ? 'completed' : (s.status === 'active' ? 'active' : 'waiting'),
            }));
          }
        }
      }
    } catch {}
    return INITIAL_SLOTS;
  };

  const [currentTab, setCurrentTab] = useState<NavTabType>(() => {
    try {
      const saved = localStorage.getItem('erus_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'super_admin') return 'super_admin';
        if (u.role === 'college_admin') return 'college_admin';
        if (u.role === 'faculty') return 'faculty';
        if (u.role === 'student') return 'topics';
      }
    } catch {}
    return 'topics';
  });
  const [availableSlots, setAvailableSlots] = useState<GDSession[]>(loadInitialSlots);
  const [session, setSession] = useState<GDSession>(() => {
    const slots = loadInitialSlots();
    return slots[0] || INITIAL_SESSION;
  });
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>(INITIAL_TRANSCRIPTS);
  const [activeReport, setActiveReport] = useState<StudentAssessmentReport>(SAMPLE_REPORT_RAHUL);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [studentBookedSlotsByTopic, setStudentBookedSlotsByTopic] = useState<Record<string, string>>(() => {
    try {
      const userRaw = localStorage.getItem('erus_auth_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.role === 'student') {
          const key = u.id || u.email || 'student';
          return getStudentBookedSlotsByTopic(key);
        }
      }
    } catch {}
    return {};
  });

  const studentBookedSlotId = useMemo(() => {
    const values = Object.values(studentBookedSlotsByTopic);
    return values.length > 0 ? values[0] : null;
  }, [studentBookedSlotsByTopic]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const slots = loadInitialSlots();
    return slots[0]?.status === 'active' ? 315 : 0;
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const { theme } = useTheme();

  // Guard: Role-based navigation restrictions
  useEffect(() => {
    if (currentUser?.role === 'super_admin' && currentTab !== 'super_admin') {
      setCurrentTab('super_admin');
      return;
    }
    if (currentUser?.role === 'student' && (currentTab === 'faculty' || currentTab === 'college_admin' || currentTab === 'super_admin')) {
      setCurrentTab('topics');
    }
    if (currentUser?.role !== 'super_admin' && currentTab === 'super_admin') {
      setCurrentTab(currentUser?.role === 'student' ? 'topics' : 'room');
    }
    if (currentUser?.role !== 'college_admin' && currentTab === 'college_admin') {
      setCurrentTab(currentUser?.role === 'student' ? 'topics' : 'room');
    }
  }, [currentUser, currentTab]);

  // Guard: When currentUser is faculty or admin, ensure all students have isUser: false so observer mode is respected
  useEffect(() => {
    if (currentUser?.role === 'faculty' || currentUser?.role === 'college_admin' || currentUser?.role === 'super_admin') {
      setSession((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.isUser ? { ...s, isUser: false } : s)),
      }));
    }
  }, [currentUser]);

  // Keep availableSlots persisted to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(availableSlots));
    } catch {}
  }, [availableSlots]);

  // Keep live faculty observation notes synchronized into availableSlots
  useEffect(() => {
    if (session.facultyLiveNotes && session.facultyLiveNotes.length > 0) {
      setAvailableSlots((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, facultyLiveNotes: session.facultyLiveNotes } : s))
      );
    }
  }, [session.id, session.facultyLiveNotes]);

  // Reset slots back to clean demo defaults
  const handleResetSlots = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      ['erus_available_slots', 'erus_available_slots_v1', 'erus_available_slots_v2', 'erus_available_slots_v3', 'erus_available_slots_v4', 'erus_available_slots_v5', 'erus_available_slots_v6', 'erus_available_slots_v7', 'erus_available_slots_v8'].forEach((k) => {
        localStorage.removeItem(k);
      });
    } catch {}
    setAvailableSlots(INITIAL_SLOTS);
    setSession(INITIAL_SLOTS[0]);
    setElapsedSeconds(0);
  };

  // Handle Login Event
  const handleLogin = (user: AuthUser) => {
    facilitatorVoice.stop();
    setCurrentUser(user);
    try {
      localStorage.setItem('erus_auth_user', JSON.stringify(user));
    } catch {}

    if (user.role === 'student') {
      setViewingStudentId(null);
      const studentKey = user.id || user.email || 'student';
      // Retrieve topic bookings if candidate booked previously
      const bookedTopics = getStudentBookedSlotsByTopic(studentKey);
      setStudentBookedSlotsByTopic(bookedTopics);

      const bookedIds = Object.values(bookedTopics);
      if (bookedIds.length > 0) {
        const targetBookedSlot = availableSlots.find((s) => bookedIds.includes(s.id)) || session;
        const activeSlotId = targetBookedSlot.id;
        const studentUserObj: Student = {
          ...INITIAL_SESSION.students[0],
          id: user.id || 'slot-stu-1',
          name: user.name,
          college: user.college,
          course: user.course,
          batch: user.batch,
          isUser: true,
          bookedSlotId: activeSlotId,
        };
        const initialStudentReport = generateStudentReport(studentUserObj, targetBookedSlot.topic, targetBookedSlot.durationMinutes);
        setActiveReport(initialStudentReport);
        addReportToStudentHistory(initialStudentReport);

        setAvailableSlots((prevSlots) =>
          prevSlots.map((slot) => {
            const isUserInSlot = bookedIds.includes(slot.id);
            return {
              ...slot,
              students: slot.students.map((s, idx) => {
                const shouldBeUser = isUserInSlot && (idx === 0 || s.id === user.id || s.seatNumber === user.seatNumber);
                return {
                  ...s,
                  isUser: shouldBeUser,
                  name: shouldBeUser ? user.name : s.name,
                  college: shouldBeUser ? user.college : s.college,
                  course: shouldBeUser ? user.course : s.course,
                  batch: shouldBeUser ? user.batch : s.batch,
                };
              }),
            };
          })
        );
        setSession((prev) => ({
          ...targetBookedSlot,
          students: targetBookedSlot.students.map((s, idx) => ({
            ...s,
            isUser: idx === 0 || s.id === user.id || s.seatNumber === user.seatNumber,
            name: (idx === 0 || s.id === user.id || s.seatNumber === user.seatNumber) ? user.name : s.name,
            college: (idx === 0 || s.id === user.id || s.seatNumber === user.seatNumber) ? user.college : s.college,
            course: (idx === 0 || s.id === user.id || s.seatNumber === user.seatNumber) ? user.course : s.course,
            batch: (idx === 0 || s.id === user.id || s.seatNumber === user.seatNumber) ? user.batch : s.batch,
          })),
        }));
      }

      // Candidate always lands on Topics & Slot Booking after logging in
      setCurrentTab('topics');
    } else if (user.role === 'faculty') {
      // Faculty evaluator starts at the Faculty Analytics dashboard and observes sessions
      setSession((prev) => ({
        ...prev,
        students: prev.students.map((s) => ({ ...s, isUser: false })),
      }));
      setAvailableSlots((prevSlots) =>
        prevSlots.map((slot) => ({
          ...slot,
          students: slot.students.map((s) => ({ ...s, isUser: false })),
        }))
      );
      setCurrentTab('faculty');
    } else if (user.role === 'college_admin') {
      setSession((prev) => ({
        ...prev,
        students: prev.students.map((s) => ({ ...s, isUser: false })),
      }));
      setCurrentTab('college_admin');
    } else if (user.role === 'super_admin') {
      setCurrentTab('super_admin');
    }
  };

  // Handle Logout Event
  const handleLogout = () => {
    facilitatorVoice.stop();
    setCurrentUser(null);
    clearStoredAuth();
  };

  // Verify stored JWT session token with Backend on mount
  useEffect(() => {
    verifyCurrentSession().then((verifiedUser) => {
      if (verifiedUser) {
        setCurrentUser(verifiedUser);
      }
    });
  }, []);

  // Sync voice engine mute state
  useEffect(() => {
    facilitatorVoice.setMuted(voiceMuted);
  }, [voiceMuted]);

  // Stop any active AI speech when outside of the discussion room or when session is not actively ongoing
  useEffect(() => {
    if (currentTab !== 'room' || session.status !== 'active') {
      facilitatorVoice.stop();
    }
  }, [currentTab, session.status]);

  // Main session elapsed timer & silence deadlock tracker (Strictly active only when room is live)
  useEffect(() => {
    if (!currentUser || currentTab !== 'room' || session.status !== 'active') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Deadlock silence detection
      setSession((prevSession) => {
        const newSilence = prevSession.silenceTimerSeconds + 1;
        // If silence reaches 20 seconds, trigger deadlock prompt
        if (newSilence === 20 && !prevSession.isFacilitatorSpeaking && !prevSession.currentSpeakerId) {
          triggerDeadlockIntervention(prevSession);
        }
        return {
          ...prevSession,
          silenceTimerSeconds: newSilence,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser, currentTab, session.status, session.isFacilitatorSpeaking, session.currentSpeakerId]);

  // Faculty In-Charge / Host Commences the Discussion Session
  const handleStartSession = (slotIdToStart?: string) => {
    const targetSlotId = slotIdToStart || session.id;

    // Reset timer to 0 for a fresh live discussion
    setElapsedSeconds(0);

    const welcomeIntroText = `Welcome participants to today's group discussion on "${session.topic}". The discussion has now officially commenced. Each participant will get an opportunity to present their perspectives. Please respect others and avoid interruptions. Let us begin. Who would like to open the discussion?`;

    sessionQuestionTracker.clear();

    // Update active session status and reset speaking metrics for fresh live discussion
    setSession((prev) => ({
      ...prev,
      status: 'active',
      silenceTimerSeconds: 0,
      currentPhase: 'intro',
      facilitatorSpeech: welcomeIntroText,
      isFacilitatorSpeaking: true,
      startedAt: Date.now(),
      students: prev.students.map((s) => ({
        ...s,
        speakingTurns: 0,
        speakingDurationSeconds: 0,
        isSpeaking: false,
      })),
    }));

    // Update availableSlots list
    setAvailableSlots((prevSlots) =>
      prevSlots.map((s) => (s.id === targetSlotId ? { 
        ...s, 
        status: 'active', 
        startedAt: Date.now(),
        students: s.students.map((st) => ({
          ...st,
          speakingTurns: 0,
          speakingDurationSeconds: 0,
          isSpeaking: false,
        })),
      } : s))
    );

    // Speak introduction only if voice is not muted and currently viewing room
    if (!voiceMuted && currentTab === 'room') {
      facilitatorVoice.speak(welcomeIntroText, () => {
        setSession((prev) => ({ ...prev, isFacilitatorSpeaking: false }));
      });
    }

    // Initialize clean transcripts list with AI welcome intro
    setTranscripts([
      {
        id: `t-start-${Date.now()}`,
        sessionId: targetSlotId,
        speakerId: 'ai-facilitator',
        speakerName: 'AI Facilitator (ERUS)',
        seatNumber: null,
        isFacilitator: true,
        timestamp: '00:00',
        timestampSeconds: 0,
        text: welcomeIntroText,
        type: 'intro',
        sentiment: 'positive',
      },
    ]);

    // Notify backend
    fetch(`/api/college/slots/${encodeURIComponent(targetSlotId)}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch((err) => console.warn('Backend start session sync:', err));
  };

  // Deadlock intervention helper using unique non-repeating dynamic prompt generator
  const triggerDeadlockIntervention = (currentSession: GDSession) => {
    const nextPrompt = getNextUniqueFacilitatorPrompt(
      currentSession.topic,
      transcripts,
      currentSession.students,
      'probing',
      true // deadlock recovery triggered
    );

    const promptText = nextPrompt.text;
    facilitatorVoice.speak(promptText);

    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (elapsedSeconds % 60).toString().padStart(2, '0');

    setTranscripts((prev) => [
      ...prev,
      {
        id: `t-deadlock-${Date.now()}`,
        sessionId: currentSession.id,
        speakerId: 'ai-facilitator',
        speakerName: 'AI Facilitator (ERUS)',
        seatNumber: null,
        isFacilitator: true,
        timestamp: `${mins}:${secs}`,
        timestampSeconds: elapsedSeconds,
        text: promptText,
        type: 'probing',
        sentiment: 'constructive',
      },
    ]);

    setSession((prev) => ({
      ...prev,
      facilitatorSpeech: promptText,
      facilitatorAction: 'Deadlock intervention (20s silence)',
      currentPhase: 'probing',
      silenceTimerSeconds: 0,
    }));
  };

  // Conclude GD and generate report
  const handleFinishSession = async () => {
    // Generate AI evaluation for current user student
    const userStudent = session.students.find((s) => s.isUser) || session.students[0];
    
    try {
      const res = await fetch('/api/facilitator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: userStudent,
          transcriptHistory: transcripts,
          sessionId: session.id,
          topic: session.topic,
          durationMinutes: session.durationMinutes,
        }),
      });

      const data = await res.json();
      if (data.report) {
        const enhancedReport: StudentAssessmentReport = {
          ...data.report,
          facultyLiveNotes: session.facultyLiveNotes?.filter(
            (n) => n.studentId === userStudent.id || n.studentName.toLowerCase() === userStudent.name.toLowerCase()
          ),
        };
        setActiveReport(enhancedReport);
        addReportToStudentHistory(enhancedReport);
      }
    } catch (e) {
      console.warn('Evaluation fallback:', e);
      const fallbackRep = generateStudentReport(userStudent, session.topic, session.durationMinutes);
      const enhancedReport: StudentAssessmentReport = {
        ...fallbackRep,
        facultyLiveNotes: session.facultyLiveNotes?.filter(
          (n) => n.studentId === userStudent.id || n.studentName.toLowerCase() === userStudent.name.toLowerCase()
        ),
      };
      setActiveReport(enhancedReport);
      addReportToStudentHistory(enhancedReport);
    }

    const finishedSlotId = session.id;

    // Conclude active session
    setSession((prev) => ({
      ...prev,
      status: 'completed',
      currentPhase: 'conclusion',
      facilitatorSpeech: 'Thank you everyone. We discussed both the advantages and disadvantages thoroughly. Individual assessment reports have now been compiled.',
    }));

    // Mark slot as completed in availableSlots roster
    setAvailableSlots((prevSlots) =>
      prevSlots.map((slot) => {
        if (slot.id === finishedSlotId || slot.id === session.id) {
          return {
            ...slot,
            status: 'completed',
            currentPhase: 'conclusion',
            facultyLiveNotes: session.facultyLiveNotes || slot.facultyLiveNotes,
          };
        }
        return slot;
      })
    );

    // Sync completion status to backend
    try {
      fetch(`/api/college/slots/${encodeURIComponent(finishedSlotId)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => console.warn('[Slot Complete Sync Notice]:', err));
    } catch {}

    setCurrentTab('report');
  };

  const handleSelectSlot = (slotId: string) => {
    const targetSlot = availableSlots.find((s) => s.id === slotId);
    if (!targetSlot) return;

    // One Slot Per Topic Policy: Enforce that students cannot select a different slot on a topic they already booked
    if (currentUser && currentUser.role === 'student') {
      const studentKey = currentUser.id || currentUser.email || 'student';
      const topicKey = targetSlot.topic || 'General Topic';
      const bookedOnTopic = studentBookedSlotsByTopic[topicKey];
      if (bookedOnTopic && bookedOnTopic !== slotId) {
        const bookedSlot = availableSlots.find((s) => s.id === bookedOnTopic);
        alert(`Slot Locked: You have already booked ${bookedSlot?.slotName || 'a slot'} for this topic ("${topicKey}"). Under institutional policy, candidates can only book one slot per topic. You may choose slots on other topics.`);
        return;
      }
      if (!bookedOnTopic) {
        const targetMaxCap = targetSlot.maxCapacity || 15;
        const targetCurrentEnrolled = targetSlot.enrolledCount ?? targetSlot.students?.length ?? 15;
        if (targetSlot.status !== 'completed' && targetCurrentEnrolled >= targetMaxCap) {
          alert(`Slot "${targetSlot.slotName || targetSlot.id}" is full (${targetCurrentEnrolled}/${targetMaxCap} students). Please select an open slot.`);
          return;
        }
        setStudentBookedSlotForTopic(studentKey, topicKey, slotId);
        setStudentBookedSlotsByTopic((prev) => ({ ...prev, [topicKey]: slotId }));
      }
    }

    // Handle Completed Session Click:
    // Never open the GD room again or play AI voice.
    // - Students see their individual 7-parameter assessment report.
    // - Faculty & Admins see overall reports and cohort analytics.
    if (targetSlot.status === 'completed') {
      facilitatorVoice.stop();
      sessionQuestionTracker.clear();

      let slotForState = targetSlot;
      if (currentUser && currentUser.role === 'student') {
        const targetStudents = targetSlot.students || [];
        let updatedTargetStudents: Student[];
        if (targetStudents.length > 0) {
          updatedTargetStudents = targetStudents.map((s, idx) => ({
            ...s,
            isUser: idx === 0 || s.id === currentUser.id,
            name: (idx === 0 || s.id === currentUser.id) ? currentUser.name : s.name,
            college: (idx === 0 || s.id === currentUser.id) ? currentUser.college : s.college,
            course: (idx === 0 || s.id === currentUser.id) ? currentUser.course : s.course,
            batch: (idx === 0 || s.id === currentUser.id) ? currentUser.batch : s.batch,
          }));
        } else {
          updatedTargetStudents = generateSlotParticipants(15).map((s, idx) => ({
            ...s,
            isUser: idx === 0,
            name: idx === 0 ? currentUser.name : s.name,
            college: idx === 0 ? currentUser.college : s.college,
            course: idx === 0 ? currentUser.course : s.course,
            batch: idx === 0 ? currentUser.batch : s.batch,
          }));
        }
        slotForState = { ...targetSlot, students: updatedTargetStudents };
        setSession(slotForState);

        const userStudent = slotForState.students.find((s) => s.isUser) || slotForState.students[0];
        const studentReport = generateStudentReport(userStudent, targetSlot.topic, targetSlot.durationMinutes);
        setActiveReport(studentReport);
        addReportToStudentHistory(studentReport);
        setViewingStudentId(userStudent.id);
        setCurrentTab('report');
      } else {
        const facultyStudents = (targetSlot.students || []).map((s) => ({ ...s, isUser: false }));
        slotForState = {
          ...targetSlot,
          students: facultyStudents.length > 0 ? facultyStudents : generateSlotParticipants(15).map((s) => ({ ...s, isUser: false })),
        };
        setSession(slotForState);
        setCurrentTab('faculty');
      }
      return;
    }

    if (slotId === session.id) return; // already in this slot

    const targetMaxCap = targetSlot.maxCapacity || 15;
    const targetCurrentEnrolled = targetSlot.enrolledCount ?? targetSlot.students?.length ?? 15;

    // Check if slot is already full
    if (targetCurrentEnrolled >= targetMaxCap) {
      alert(`Slot "${targetSlot.slotName || targetSlot.id}" is full (${targetCurrentEnrolled}/${targetMaxCap} students). Please select an open slot.`);
      return;
    }

    sessionQuestionTracker.clear();

    const previousSlotId = session.id;

    // Build updated student roster for target slot with user at Seat 1
    const targetStudents = targetSlot.students || [];
    let updatedTargetStudents: Student[];

    if (currentUser && currentUser.role === 'student') {
      if (targetStudents.length > 0) {
        updatedTargetStudents = targetStudents.map((s, idx) => ({
          ...s,
          isUser: idx === 0 || s.id === currentUser.id,
          name: (idx === 0 || s.id === currentUser.id) ? currentUser.name : s.name,
          college: (idx === 0 || s.id === currentUser.id) ? currentUser.college : s.college,
          course: (idx === 0 || s.id === currentUser.id) ? currentUser.course : s.course,
          batch: (idx === 0 || s.id === currentUser.id) ? currentUser.batch : s.batch,
        }));
      } else {
        updatedTargetStudents = generateSlotParticipants(targetCurrentEnrolled + 1).map((s, idx) => ({
          ...s,
          isUser: idx === 0,
          name: idx === 0 ? currentUser.name : s.name,
          college: idx === 0 ? currentUser.college : s.college,
          course: idx === 0 ? currentUser.course : s.course,
          batch: idx === 0 ? currentUser.batch : s.batch,
        }));
      }
    } else {
      updatedTargetStudents = targetStudents.map((s) => ({ ...s, isUser: false }));
    }

    const isStudentUser = currentUser && currentUser.role === 'student';
    const newTargetEnrolledCount = isStudentUser
      ? Math.min(targetMaxCap, targetCurrentEnrolled + 1)
      : targetCurrentEnrolled;

    const targetStatus = targetSlot.status === 'completed'
      ? 'completed'
      : (targetSlot.status === 'active' ? 'active' : 'waiting');

    const activeSlot: GDSession = {
      ...targetSlot,
      status: targetStatus,
      maxCapacity: targetMaxCap,
      enrolledCount: newTargetEnrolledCount,
      students: updatedTargetStudents,
    };

    // Update availableSlots:
    if (isStudentUser) {
      setAvailableSlots((prevSlots) =>
        prevSlots.map((s) => {
          if (s.id === slotId) {
            return activeSlot;
          }
          if (s.id === previousSlotId) {
            const prevCount = s.enrolledCount ?? s.students?.length ?? 15;
            const newPrevCount = Math.max(1, prevCount - 1);
            return {
              ...s,
              status: s.status === 'completed' ? 'completed' : 'waiting',
              enrolledCount: newPrevCount,
              students: s.students.map((st) => (st.isUser ? { ...st, isUser: false } : st)),
            };
          }
          return s;
        })
      );
    } else {
      setAvailableSlots((prevSlots) =>
        prevSlots.map((s) => (s.id === slotId ? activeSlot : s))
      );
    }

    setSession(activeSlot);
    setTranscripts([
      {
        id: `t-slot-${Date.now()}`,
        sessionId: activeSlot.id,
        speakerId: 'ai-facilitator',
        speakerName: 'AI Facilitator (ERUS)',
        seatNumber: null,
        isFacilitator: true,
        timestamp: '00:00',
        timestampSeconds: 0,
        text: activeSlot.status === 'active'
          ? (activeSlot.facilitatorSpeech || `Welcome to ${activeSlot.slotName || 'this slot'}. The discussion on "${activeSlot.topic}" is underway.`)
          : `Welcome to ${activeSlot.slotName || 'this slot'}. The discussion on "${activeSlot.topic}" is currently in the waiting lobby. The session will commence once started by Faculty In-Charge (${activeSlot.assignedFacultyName || 'Assigned Faculty'}).`,
        type: 'intro',
        sentiment: 'positive',
      },
    ]);
    setElapsedSeconds(0);
  };

  const handleCreateSessions = (newSessions: GDSession[]) => {
    if (!newSessions || newSessions.length === 0) return;

    sessionQuestionTracker.clear();
    setAvailableSlots((prev) => [...newSessions, ...prev]);

    // Persist new slots to backend college API if college admin
    if (currentUser?.role === 'college_admin') {
      newSessions.forEach((s) => {
        createCollegeSlot({
          topic: s.topic,
          description: s.description,
          durationMinutes: s.durationMinutes,
          difficulty: s.difficulty,
          slotTiming: s.slotTiming,
          slotName: s.slotName,
          maxCapacity: s.maxCapacity || 15,
          collegeCode: (currentUser as any).collegeCode || 'DIT',
          assignedFacultyId: s.assignedFacultyId,
          assignedFacultyName: s.assignedFacultyName,
          assignedFacultyDept: s.assignedFacultyDept,
          assignedFacultyEmail: s.assignedFacultyEmail,
        }).catch((err) => console.warn('Failed to sync new slot to backend:', err));
      });
    }

    const activeNewSession = { ...newSessions[0], status: 'active' as const };
    setSession(activeNewSession);
    setTranscripts([
      {
        id: `t-init-${Date.now()}`,
        sessionId: activeNewSession.id,
        speakerId: 'ai-facilitator',
        speakerName: 'AI Facilitator (ERUS)',
        seatNumber: null,
        isFacilitator: true,
        timestamp: '00:00',
        timestampSeconds: 0,
        text: activeNewSession.facilitatorSpeech,
        type: 'intro',
        sentiment: 'positive',
      },
    ]);
    setElapsedSeconds(0);

    // Keep college admin in the admin dashboard so they can review their created slots
    if (currentUser?.role === 'college_admin') {
      setCurrentTab('college_admin');
    } else {
      setCurrentTab('room');
    }
  };

  const handleCreateSession = (newSession: GDSession) => {
    handleCreateSessions([newSession]);
  };

  const handleViewStudentReport = (studentId: string) => {
    setViewingStudentId(studentId);
    setCurrentTab('report');
  };

  // Student books a slot (One Slot Per Topic Policy)
  const handleBookSlot = (slotId: string) => {
    if (!currentUser || currentUser.role !== 'student') return;
    const studentKey = currentUser.id || currentUser.email || 'student';

    const targetSlot = availableSlots.find((s) => s.id === slotId);
    if (!targetSlot) return;
    const topicKey = targetSlot.topic || 'General Topic';

    // One Slot Per Topic Policy: Candidate cannot book more than one slot for the SAME topic
    const existingSlotIdOnThisTopic = studentBookedSlotsByTopic[topicKey];
    if (existingSlotIdOnThisTopic) {
      const alreadyBooked = availableSlots.find((s) => s.id === existingSlotIdOnThisTopic);
      alert(`Under institutional policy, candidates can only book one slot per topic. You already have a confirmed booking for "${alreadyBooked?.slotName || topicKey}". You may select slots on other topics or revive this slot before 1 hour of its start time.`);
      return;
    }

    const maxCap = targetSlot.maxCapacity || 15;
    const currentEnrolled = targetSlot.enrolledCount ?? targetSlot.students?.length ?? 0;
    if (targetSlot.status !== 'completed' && currentEnrolled >= maxCap) {
      alert(`Slot "${targetSlot.slotName || targetSlot.id}" is full (${currentEnrolled}/${maxCap} candidates). Please select another open slot.`);
      return;
    }

    // Save booking to localStorage & state for this topic
    setStudentBookedSlotForTopic(studentKey, topicKey, slotId);
    setStudentBookedSlotsByTopic((prev) => ({ ...prev, [topicKey]: slotId }));

    // Sync booking to backend API
    try {
      fetch('/api/student/book-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentKey,
          studentIdentifier: studentKey,
          slotId,
          topic: topicKey,
          studentName: currentUser.name,
          studentCollege: currentUser.college,
        }),
      }).catch((err) => console.warn('[Student Slot Booking Sync]:', err));
    } catch {}

    // Update students list in the booked slot
    const targetStudents = targetSlot.students || [];
    let updatedTargetStudents: Student[];
    if (targetStudents.length > 0) {
      updatedTargetStudents = targetStudents.map((s, idx) => ({
        ...s,
        isUser: idx === 0 || s.id === currentUser.id,
        name: (idx === 0 || s.id === currentUser.id) ? currentUser.name : s.name,
        college: (idx === 0 || s.id === currentUser.id) ? currentUser.college : s.college,
        course: (idx === 0 || s.id === currentUser.id) ? currentUser.course : s.course,
        batch: (idx === 0 || s.id === currentUser.id) ? currentUser.batch : s.batch,
        bookedSlotId: slotId,
      }));
    } else {
      updatedTargetStudents = generateSlotParticipants(currentEnrolled + 1).map((s, idx) => ({
        ...s,
        isUser: idx === 0,
        name: idx === 0 ? currentUser.name : s.name,
        college: idx === 0 ? currentUser.college : s.college,
        course: idx === 0 ? currentUser.course : s.course,
        batch: idx === 0 ? currentUser.batch : s.batch,
        bookedSlotId: slotId,
      }));
    }

    const updatedSlot: GDSession = {
      ...targetSlot,
      enrolledCount: Math.min(maxCap, currentEnrolled + 1),
      students: updatedTargetStudents,
    };

    setAvailableSlots((prevSlots) =>
      prevSlots.map((s) => (s.id === slotId ? updatedSlot : s))
    );

    setSession(updatedSlot);

    const studentUserObj = updatedTargetStudents.find((s) => s.isUser) || updatedTargetStudents[0];
    const initialStudentReport = generateStudentReport(studentUserObj, targetSlot.topic, targetSlot.durationMinutes);
    setActiveReport(initialStudentReport);
    addReportToStudentHistory(initialStudentReport);
  };

  // Student revives (releases/cancels) their booked slot before 1 hour of slot start
  const handleReviveSlot = (slotId: string) => {
    if (!currentUser || currentUser.role !== 'student') return;
    const studentKey = currentUser.id || currentUser.email || 'student';

    const targetSlot = availableSlots.find((s) => s.id === slotId);
    if (!targetSlot) return;
    const topicKey = targetSlot.topic || 'General Topic';

    // Check 1-hour policy
    const check = checkCanReviveSlot(targetSlot);
    if (!check.canRevive) {
      alert(`Cannot Revive Slot: ${check.reason}`);
      return;
    }

    // Clear local storage and state for this topic
    clearStudentBookedSlotForTopic(studentKey, topicKey, slotId);
    setStudentBookedSlotsByTopic((prev) => {
      const next = { ...prev };
      delete next[topicKey];
      return next;
    });

    // Sync cancellation to backend
    try {
      fetch('/api/student/cancel-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentKey,
          studentIdentifier: studentKey,
          slotId,
          topic: topicKey,
        }),
      }).catch((err) => console.warn('[Student Slot Cancel Sync]:', err));
    } catch {}

    // Decrement enrolled count and remove isUser flag from slot students
    setAvailableSlots((prevSlots) =>
      prevSlots.map((s) => {
        if (s.id === slotId) {
          const currentCount = s.enrolledCount ?? s.students?.length ?? 1;
          return {
            ...s,
            enrolledCount: Math.max(0, currentCount - 1),
            students: s.students.map((st) => (st.isUser ? { ...st, isUser: false } : st)),
          };
        }
        return s;
      })
    );

    if (session.id === slotId) {
      setSession((prev) => ({
        ...prev,
        students: prev.students.map((st) => (st.isUser ? { ...st, isUser: false } : st)),
      }));
    }
  };

  // If unauthenticated, render the Dedicated Student / Faculty Authentication Portal
  if (!currentUser) {
    return <AuthPortal onLogin={handleLogin} defaultRole="student" />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      
      {/* Top Main Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        voiceMuted={voiceMuted}
        setVoiceMuted={setVoiceMuted}
        elapsedSeconds={elapsedSeconds}
        onOpenCreateSession={() => setIsCreateModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        bookedSlotId={studentBookedSlotId}
      />

      {/* Main Responsive Application Viewport */}
      <main className="flex-1 pb-10 px-2 sm:px-4 max-w-7xl mx-auto w-full">
        {currentTab === 'topics' && (
          <StudentTopicPortal
            availableSlots={availableSlots}
            bookedSlotId={studentBookedSlotId}
            bookedSlotsByTopic={studentBookedSlotsByTopic}
            currentUser={currentUser}
            onBookSlot={handleBookSlot}
            onReviveSlot={handleReviveSlot}
            onEnterRoom={(slotId) => {
              handleSelectSlot(slotId);
              setCurrentTab('room');
              const target = availableSlots.find((s) => s.id === slotId);
              if (target && target.status === 'waiting') {
                handleStartSession(slotId);
              }
            }}
          />
        )}

        {currentTab === 'room' && (
          <RealisticGDRoom
            session={session}
            setSession={setSession}
            transcripts={transcripts}
            setTranscripts={setTranscripts}
            onFinishSession={handleFinishSession}
            onStartSession={handleStartSession}
            voiceMuted={voiceMuted}
            elapsedSeconds={elapsedSeconds}
            availableSlots={availableSlots}
            onSelectSlot={handleSelectSlot}
            onResetSlots={handleResetSlots}
            currentUser={currentUser}
            bookedSlotId={studentBookedSlotId}
            onUpdateLayout={(newLayout) => {
              setSession((prev) => ({ ...prev, roomLayout: newLayout }));
              setAvailableSlots((prev) =>
                prev.map((s) => (s.id === session.id ? { ...s, roomLayout: newLayout } : s))
              );
            }}
          />
        )}

        {currentTab === 'report' && (
          <StudentReportView
            session={session}
            report={activeReport}
            onBackToRoom={() => {
              if (session.status === 'completed') {
                if (currentUser?.role !== 'student') {
                  const openSlot = availableSlots.find((s) => s.status !== 'completed');
                  if (openSlot) {
                    handleSelectSlot(openSlot.id);
                    return;
                  }
                }
              }
              setCurrentTab('room');
            }}
            onViewFacultyDashboard={() => setCurrentTab('faculty')}
            currentUser={currentUser}
            targetStudentId={viewingStudentId}
            availableSlots={availableSlots}
            onSelectSlot={handleSelectSlot}
            bookedSlotId={studentBookedSlotId}
          />
        )}

        {currentTab === 'faculty' && (
          <FacultyDashboardView
            session={session}
            transcripts={transcripts}
            onViewStudentReport={handleViewStudentReport}
            onBackToRoom={() => {
              if (session.status === 'completed') {
                const openSlot = availableSlots.find((s) => s.status !== 'completed');
                if (openSlot) {
                  handleSelectSlot(openSlot.id);
                  return;
                }
              }
              setCurrentTab('room');
            }}
            onStartSession={handleStartSession}
            availableSlots={availableSlots}
            onSelectSlot={handleSelectSlot}
          />
        )}

        {currentTab === 'super_admin' && currentUser?.role === 'super_admin' && (
          <SuperAdminDashboard
            currentUser={currentUser}
          />
        )}

        {currentTab === 'college_admin' && currentUser?.role === 'college_admin' && (
          <CollegeAdminDashboard
            currentUser={currentUser}
            availableSlots={availableSlots}
            onOpenCreateSession={() => setIsCreateModalOpen(true)}
            onCreateSlot={handleCreateSession}
            onEnterGDRoom={(slot) => {
              if (slot) {
                handleSelectSlot(typeof slot === 'string' ? slot : (slot.id || ''));
              } else {
                setCurrentTab('room');
              }
            }}
          />
        )}
      </main>

      {/* Session Creation Modal */}
      <SessionCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSessions={handleCreateSessions}
        onCreateSession={handleCreateSession}
      />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GDAppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
