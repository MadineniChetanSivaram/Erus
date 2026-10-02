import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Calendar, 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Eye, 
  Play, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  Award,
  BarChart3,
  Trash2,
  Mail,
  Key,
  EyeOff,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { CollegeAdminUser } from '../../types/auth';
import { GDSession } from '../../types/gd';
import { generateSlotParticipants } from '../../data/mockGDData';
import { 
  fetchCollegeStats, 
  fetchCollegeStudents, 
  addCollegeStudents, 
  fetchCollegeFaculty, 
  addCollegeFaculty, 
  fetchCollegeSlots, 
  createCollegeSlot,
  deleteCollegeSlot,
  dispatchCredentials
} from '../../utils/authApi';
import { formatSlotDate } from '../../utils/studentBooking';
import { SlotStudentReportsView } from '../AssessmentReport/SlotStudentReportsView';

interface CollegeAdminDashboardProps {
  currentUser: CollegeAdminUser;
  onEnterGDRoom?: (slot?: GDSession) => void;
  availableSlots?: GDSession[];
  onOpenCreateSession?: () => void;
  onCreateSlot?: (session: GDSession) => void;
  onDeleteSlot?: (slotId: string) => void;
}

export const CollegeAdminDashboard: React.FC<CollegeAdminDashboardProps> = ({
  currentUser,
  onEnterGDRoom,
  availableSlots,
  onOpenCreateSession,
  onCreateSlot,
  onDeleteSlot,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'slots'>('students');
  const [selectedReportSlotId, setSelectedReportSlotId] = useState<string>('');

  // Stats state
  const [stats, setStats] = useState({
    collegeName: currentUser.college || 'Academic Institution',
    collegeCode: currentUser.collegeCode || 'COL',
    totalStudents: 0,
    totalFaculty: 0,
    scheduledSlots: 0,
    completedSlots: 0,
    totalSlots: 0,
  });

  // Students Roster State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: '',
    course: 'B.Tech Computer Science & Engineering',
    batch: '2024-2028',
    seatNumber: 1,
    password: `Stud@${Math.floor(1000 + Math.random() * 9000)}!`,
    sendEmail: true,
  });

  // Faculty Roster State
  const [faculty, setFaculty] = useState<any[]>([]);
  const [facultySearch, setFacultySearch] = useState('');
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    facultyId: '',
    department: 'Department of Computer Science & Engineering',
    designation: 'Assistant Professor',
    password: `Fac@${Math.floor(1000 + Math.random() * 9000)}!`,
    sendEmail: true,
  });

  // Slots State
  const [slots, setSlots] = useState<any[]>([]);
  const [deletedSlotIds, setDeletedSlotIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('erus_deleted_slot_ids');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isScheduleSlotOpen, setIsScheduleSlotOpen] = useState(false);

  // Computed display slots: merges parent availableSlots and locally scheduled slots without dropping any
  const allRawSlots: any[] = [...(availableSlots || []), ...slots];
  const seenSlotIds = new Set<string>();
  const displaySlots = allRawSlots
    .filter((s) => {
      if (!s || !s.id || deletedSlotIds.has(s.id) || seenSlotIds.has(s.id)) return false;
      try {
        const rawDel = localStorage.getItem('erus_deleted_slot_ids');
        if (rawDel) {
          const parsed = JSON.parse(rawDel);
          if (Array.isArray(parsed) && parsed.includes(s.id)) return false;
        }
      } catch {}
      seenSlotIds.add(s.id);
      return true;
    })
    .map((s) => ({
      id: s.id,
      slotName: s.slotName || s.topic,
      topic: s.topic,
      description: s.description || s.topic,
      slotTiming: s.slotTiming || '',
      slotDate: s.slotDate || (s as any).scheduledTime || (s as any).rawSession?.slotDate || 'Today',
      status: s.status || 'scheduled',
      durationMinutes: s.durationMinutes || 15,
      enrolledCount: s.enrolledCount ?? s.students?.length ?? 0,
      maxCapacity: s.maxCapacity || 15,
      assignedFacultyName: (s as any).assignedFacultyName || 'Unassigned',
      rawSession: s,
    }));

  const [newSlot, setNewSlot] = useState({
    slotName: 'Slot 1: Campus Placement Screening',
    topic: 'Impact of Generative AI on Tech Hiring & Software Engineering',
    description: 'Autonomous AI evaluation of technical argumentation, structured thinking, and empathy.',
    durationMinutes: 15,
    difficulty: 'Intermediate',
    slotDate: new Date().toISOString().split('T')[0],
    slotTiming: '10:30 AM - 10:45 AM',
    participantCount: 8,
    maxCapacity: 15,
    assignedFacultyId: '',
    assignedFacultyName: '',
  });

  const [loading, setLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Password visibility & clipboard state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyPassword = (id: string, pass?: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedPasswordId(id);
    setTimeout(() => setCopiedPasswordId(null), 2000);
  };

  const toggleShowAllPasswords = () => {
    const next = !showAllPasswords;
    setShowAllPasswords(next);
    const map: Record<string, boolean> = {};
    if (activeTab === 'students') {
      students.forEach((s) => {
        const key = s.id || s.studentId || s.email;
        map[key] = next;
      });
    } else if (activeTab === 'faculty') {
      faculty.forEach((f) => {
        const key = f.id || f.facultyId || f.email;
        map[key] = next;
      });
    }
    setRevealedPasswords((prev) => ({ ...prev, ...map }));
  };

  const collegeCode = currentUser.collegeCode || 'DIT';

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [collegeCode]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stData, stuData, facData, slotData] = await Promise.all([
        fetchCollegeStats(collegeCode),
        fetchCollegeStudents(collegeCode),
        fetchCollegeFaculty(collegeCode),
        fetchCollegeSlots(collegeCode),
      ]);

      if (stData) setStats(stData);
      if (stuData) setStudents(stuData);
      if (facData) {
        setFaculty(facData);
        if (!newSlot.assignedFacultyId && facData.length > 0) {
          setNewSlot((prev) => ({
            ...prev,
            assignedFacultyId: facData[0].facultyId,
            assignedFacultyName: facData[0].name,
          }));
        }
      }
      if (slotData) {
        let deletedIds = new Set<string>();
        try {
          const rawDel = localStorage.getItem('erus_deleted_slot_ids');
          if (rawDel) deletedIds = new Set(JSON.parse(rawDel));
        } catch {}
        setSlots(slotData.filter((s: any) => !deletedIds.has(s.id) && !deletedSlotIds.has(s.id)));
      }
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Student Actions
  const handleDispatchAllStudentsEmail = async () => {
    if (students.length === 0) return;
    if (!window.confirm(`Dispatch login credentials via email to all ${students.length} students?`)) return;
    setIsDispatching(true);
    const res = await dispatchCredentials({
      collegeCode,
      targetType: 'students',
    });
    setIsDispatching(false);
    if (res && res.success) {
      setBannerMsg(res.message || `Dispatched credentials to ${students.length} students via email.`);
    } else {
      setBannerMsg(res?.error || 'Failed to dispatch student credentials.');
    }
  };

  const handleDispatchSingleStudentEmail = async (st: any) => {
    setIsDispatching(true);
    const res = await dispatchCredentials({
      collegeCode,
      targetType: 'single',
      recipientId: st.id,
      email: st.email,
    });
    setIsDispatching(false);
    if (res && res.success) {
      setBannerMsg(`Credentials dispatched to ${st.name} (${st.email}).`);
    } else {
      setBannerMsg(res?.error || 'Failed to dispatch email.');
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) return;

    const usedSeats = new Set(students.map((s) => Number(s.seatNumber)).filter(Boolean));
    let assignedSeat = Number(newStudent.seatNumber);
    if (!assignedSeat || assignedSeat < 1) {
      assignedSeat = 1;
      while (usedSeats.has(assignedSeat)) assignedSeat++;
    }

    const studentToAdd = {
      id: `s-${Date.now().toString().slice(-5)}`,
      name: newStudent.name.trim(),
      email: newStudent.email.trim(),
      studentId: newStudent.studentId.trim() || `STU-${Date.now().toString().slice(-4)}`,
      course: newStudent.course,
      batch: newStudent.batch,
      seatNumber: assignedSeat,
      college: currentUser.college || 'BMS Institute of Technology',
      collegeCode,
      password: newStudent.password || 'password123',
      sendEmail: newStudent.sendEmail,
    };

    // Immediately update local state so newly added student appears instantly
    setStudents((prev) => [studentToAdd, ...prev]);
    setStats((prev) => ({ ...prev, totalStudents: (prev.totalStudents || 0) + 1 }));

    const res = await addCollegeStudents({
      student: studentToAdd,
      collegeCode,
    });

    if (res && res.success) {
      setBannerMsg(`Student ${studentToAdd.name} registered (Assigned Seat ${assignedSeat}).${newStudent.sendEmail ? ' Credentials dispatched to email.' : ''}`);
      setIsAddStudentOpen(false);
      const nextUsed = new Set([...students, studentToAdd].map((s) => Number(s.seatNumber)).filter(Boolean));
      let nextSeat = 1;
      while (nextUsed.has(nextSeat)) nextSeat++;
      setNewStudent({
        name: '',
        email: '',
        studentId: '',
        course: 'B.Tech Computer Science & Engineering',
        batch: '2024-2028',
        seatNumber: nextSeat > 15 ? 1 : nextSeat,
        password: `Stud@${Math.floor(1000 + Math.random() * 9000)}!`,
        sendEmail: true,
      });
      loadAllData();
    }
  };

  // CSV parsing
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const parsed: any[] = [];
      const usedSeats = new Set(students.map((s) => Number(s.seatNumber)).filter(Boolean));
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          let csvSeat = parseInt(parts[5], 10);
          if (!csvSeat || csvSeat < 1 || usedSeats.has(csvSeat)) {
            csvSeat = 1;
            while (usedSeats.has(csvSeat)) csvSeat++;
          }
          usedSeats.add(csvSeat);
          parsed.push({
            name: parts[0],
            email: parts[1],
            studentId: parts[2] || `STU-${Date.now().toString().slice(-4)}-${i}`,
            course: parts[3] || 'B.Tech CSE',
            batch: parts[4] || '2024-2028',
            seatNumber: csvSeat,
          });
        }
      }
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleUploadCsvSubmit = async () => {
    if (csvPreview.length === 0) return;
    setLoading(true);

    const enrichedStudents = csvPreview.map((s, idx) => ({
      ...s,
      id: s.id || `s-${Date.now()}-${idx}`,
      college: currentUser.college || 'Delhi Institute of Technology',
      collegeCode,
    }));

    // Immediately update state so all CSV imported students appear in the roster
    setStudents((prev) => [...enrichedStudents, ...prev]);
    setStats((prev) => ({ ...prev, totalStudents: (prev.totalStudents || 0) + enrichedStudents.length }));

    const res = await addCollegeStudents({
      students: enrichedStudents,
      collegeCode,
    });
    setLoading(false);

    if (res && res.success) {
      setBannerMsg(`Successfully imported ${res.addedCount || enrichedStudents.length} students from CSV.`);
      setIsCsvModalOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      loadAllData();
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = 
`Name,Email,StudentID,Course,Batch,SeatNumber
Aarav Sharma,aarav.sharma@dit.edu.in,STU-2022-201,B.Tech CSE,2022-2026,1
Ishita Patel,ishita.patel@dit.edu.in,STU-2022-202,B.Tech CSE,2022-2026,2
Rohan Gupta,rohan.gupta@dit.edu.in,STU-2022-203,B.Tech IT,2022-2026,3
Ananya Deshmukh,ananya.d@dit.edu.in,STU-2022-204,B.Tech ECE,2022-2026,4
Karan Verma,karan.verma@dit.edu.in,STU-2022-205,B.Tech AI,2022-2026,5`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Faculty Actions
  const handleDispatchAllFacultyEmail = async () => {
    if (faculty.length === 0) return;
    if (!window.confirm(`Dispatch login credentials via email to all ${faculty.length} faculty members?`)) return;
    setIsDispatching(true);
    const res = await dispatchCredentials({
      collegeCode,
      targetType: 'faculty',
    });
    setIsDispatching(false);
    if (res && res.success) {
      setBannerMsg(res.message || `Dispatched credentials to ${faculty.length} faculty members via email.`);
    } else {
      setBannerMsg(res?.error || 'Failed to dispatch faculty credentials.');
    }
  };

  const handleDispatchSingleFacultyEmail = async (fac: any) => {
    setIsDispatching(true);
    const res = await dispatchCredentials({
      collegeCode,
      targetType: 'single',
      recipientId: fac.id,
      email: fac.email,
    });
    setIsDispatching(false);
    if (res && res.success) {
      setBannerMsg(`Credentials dispatched to ${fac.name} (${fac.email}).`);
    } else {
      setBannerMsg(res?.error || 'Failed to dispatch email.');
    }
  };

  const handleAddFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.email) return;

    const facultyToAdd = {
      ...newFaculty,
      id: `fac-${Date.now()}`,
      college: currentUser.college || 'Delhi Institute of Technology',
      collegeCode,
      password: newFaculty.password || 'faculty123',
      sendEmail: newFaculty.sendEmail,
    };

    setFaculty((prev) => [facultyToAdd, ...prev]);
    setStats((prev) => ({ ...prev, totalFaculty: (prev.totalFaculty || 0) + 1 }));

    const res = await addCollegeFaculty(facultyToAdd);

    if (res && res.success) {
      setBannerMsg(`Faculty member ${newFaculty.name} registered.${newFaculty.sendEmail ? ' Credentials dispatched to email.' : ''}`);
      setIsAddFacultyOpen(false);
      setNewFaculty({
        name: '',
        email: '',
        facultyId: '',
        department: 'Department of Computer Science & Engineering',
        designation: 'Assistant Professor',
        password: `Fac@${Math.floor(1000 + Math.random() * 9000)}!`,
        sendEmail: true,
      });
      loadAllData();
    }
  };

  const handleDeleteSlot = async (slot: any) => {
    if (!slot?.id) return;
    if (slot.status === 'active') {
      setBannerMsg('An active GD session cannot be deleted. End the session first.');
      return;
    }

    const confirmed = window.confirm(
      'Delete "' + (slot.slotName || slot.topic || 'this GD slot') + '"? This will remove the slot from the student portal.'
    );
    if (!confirmed) return;

    // Immediately remove from local state and persist to localStorage so it never comes back
    setDeletedSlotIds((prev) => {
      const next = new Set([...prev, slot.id]);
      try {
        localStorage.setItem('erus_deleted_slot_ids', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    setStats((prev) => ({
      ...prev,
      totalSlots: Math.max(0, (prev.totalSlots || 0) - 1),
      scheduledSlots: slot.status === 'scheduled'
        ? Math.max(0, (prev.scheduledSlots || 0) - 1)
        : prev.scheduledSlots,
    }));

    if (onDeleteSlot) {
      onDeleteSlot(slot.id);
    }

    setLoading(true);
    const res = await deleteCollegeSlot(slot.id, collegeCode);
    setLoading(false);

    if (res?.success) {
      setBannerMsg('GD slot deleted successfully.');
      await loadAllData();
    } else {
      setBannerMsg(res?.error || 'GD slot removed from roster.');
    }
  };

  // Slot Actions
  const handleScheduleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.topic) return;

    const newSessionId = `slot-${collegeCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    
    const requestedCount = Math.max(2, Math.min(15, newSlot.participantCount || 8));
    
    // Auto-populate initial participants using the college's real students if available
    const enrolledStudents = (students.length > 0 ? students.slice(0, requestedCount) : []).map((stu, idx) => ({
      id: stu.id || `s-${idx + 1}`,
      name: stu.name,
      college: stu.college || currentUser.college || 'Engineering Institute',
      course: stu.course || 'B.Tech',
      batch: stu.batch || '2022-2026',
      seatNumber: idx + 1,
      isUser: false,
      micActive: false,
      avatar: (stu as any).avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(stu.name)}`,
      speakingDurationSeconds: 0,
      speakingTurns: 0,
      interruptionCount: 0,
      questionsAnswered: 0,
      questionsInitiated: 0,
      isSpeaking: false,
      hasRaisedHand: false,
      sentiment: 'neutral' as const,
    }));

    // If enrolled students are fewer than requestedCount, fill the remaining seats with generated AI peer participants
    let finalStudents = [...enrolledStudents];
    if (finalStudents.length < requestedCount) {
      const remainingNeeded = requestedCount - finalStudents.length;
      const fillers = generateSlotParticipants(remainingNeeded).map((f, i) => ({
        ...f,
        id: `peer-${Date.now()}-${i + 1}`,
        seatNumber: finalStudents.length + i + 1,
        isUser: false,
      }));
      finalStudents = [...finalStudents, ...fillers];
    }

    const sessionObj: GDSession = {
      id: newSessionId,
      topic: newSlot.topic,
      description: newSlot.description || `Autonomous AI evaluated GD on ${newSlot.topic}`,
      durationMinutes: newSlot.durationMinutes || 15,
      difficulty: (newSlot.difficulty as any) || 'Intermediate',
      assessmentRubric: 'Standard Academic 7-Parameter Rubric',
      status: 'scheduled',
      slotName: newSlot.slotName,
      slotTiming: newSlot.slotTiming,
      slotDate: newSlot.slotDate || new Date().toISOString().split('T')[0],
      maxCapacity: requestedCount,
      enrolledCount: 0,
      assignedFacultyId: newSlot.assignedFacultyId,
      assignedFacultyName: newSlot.assignedFacultyName,
      students: finalStudents,
      currentPhase: 'intro',
      facilitatorSpeech: `Welcome candidates to ${newSlot.slotName}. The topic for today's discussion is "${newSlot.topic}".`,
      facilitatorAction: 'Waiting to start discussion',
      isFacilitatorSpeaking: false,
      silenceTimerSeconds: 0,
      currentSpeakerId: null,
      breakoutRooms: [],
      createdAt: new Date().toISOString(),
    };

    if (onCreateSlot) {
      onCreateSlot(sessionObj);
    }

    const slotPayload = {
      ...newSlot,
      id: newSessionId,
      collegeCode,
      slotDate: newSlot.slotDate || new Date().toISOString().split('T')[0],
      studentIds: [],
      enrolledCount: 0,
      rawSession: sessionObj,
    };

    setSlots((prev) => [slotPayload, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalSlots: (prev.totalSlots || 0) + 1,
      scheduledSlots: (prev.scheduledSlots || 0) + 1,
    }));

    const res = await createCollegeSlot(slotPayload);

    if (res && res.success) {
      setBannerMsg(`GD Slot "${newSlot.slotName}" scheduled successfully.`);
      setIsScheduleSlotOpen(false);
      loadAllData();
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.course?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name?.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.facultyId?.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.department?.toLowerCase().includes(facultySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pt-2">
      
      {/* Institution Banner Card */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-2xl rounded-l-full pointer-events-none transform translate-x-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20 shadow-inner shrink-0">
              <Building2 className="w-9 h-9 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-mono font-bold tracking-wider">
                  CODE: {currentUser.collegeCode || 'DIT'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold">
                  ACTIVE CAMPUS
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
                {currentUser.college || 'Delhi Institute of Technology'}
              </h1>
              <p className="text-amber-100/90 text-xs sm:text-sm mt-0.5 font-medium">
                Admin: <span className="font-bold">{currentUser.name}</span> • {currentUser.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
              <span>Campus Governance Only</span>
            </span>
          </div>
        </div>
      </div>

      {/* Alert / Banner notification */}
      {bannerMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {students.length || stats.totalStudents}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Active Academic Roster
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faculty Evaluators</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {faculty.length || stats.totalFaculty}
          </div>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Registered Evaluators
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Scheduled Slots</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {displaySlots.filter((s) => s.status === 'scheduled').length || stats.scheduledSlots}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Ready for Facilitation
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed GDs</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {displaySlots.filter((s) => s.status === 'completed').length || stats.completedSlots}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Evaluated & Graded
          </span>
        </div>
      </div>

      {/* Main Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Roster ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('faculty')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'faculty'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Faculty Directory ({faculty.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'slots'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>GD Slot Scheduler ({displaySlots.length})</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: STUDENT ROSTER MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Table Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name, ID, or course..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={toggleShowAllPasswords}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title={showAllPasswords ? "Hide all default passwords" : "Show all default passwords"}
              >
                {showAllPasswords ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-amber-600" />}
                <span>{showAllPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>

              <button
                onClick={handleDispatchAllStudentsEmail}
                disabled={isDispatching || students.length === 0}
                title="Dispatch login credentials to all students via email"
                className="px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Dispatch All to Email</span>
              </button>

              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>Bulk CSV Import</span>
              </button>

              <button
                onClick={() => {
                  const used = new Set(students.map((s) => Number(s.seatNumber)).filter(Boolean));
                  let nextSeat = 1;
                  while (used.has(nextSeat)) nextSeat++;
                  setNewStudent({
                    name: '',
                    email: '',
                    studentId: `STU-${Date.now().toString().slice(-4)}`,
                    course: 'B.Tech Computer Science & Engineering',
                    batch: '2024-2028',
                    seatNumber: nextSeat > 15 ? 1 : nextSeat,
                    password: `Stud@${Math.floor(1000 + Math.random() * 9000)}!`,
                    sendEmail: true,
                  });
                  setIsAddStudentOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Course / Department</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Default Seat</th>
                  <th className="py-3 px-4">Default Password</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Credentials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, idx) => (
                    <tr key={st.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {st.studentId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {st.course}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {st.batch}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          Seat {st.seatNumber || (idx + 1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-all">
                            {revealedPasswords[st.id || st.studentId || st.email] || showAllPasswords
                              ? (st.password || 'password123')
                              : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(st.id || st.studentId || st.email)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded cursor-pointer"
                            title={revealedPasswords[st.id || st.studentId || st.email] || showAllPasswords ? "Hide password" : "Show password"}
                          >
                            {revealedPasswords[st.id || st.studentId || st.email] || showAllPasswords ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(st.id || st.studentId || st.email, st.password || 'password123')}
                            className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors rounded cursor-pointer"
                            title="Copy password"
                          >
                            {copiedPasswordId === (st.id || st.studentId || st.email) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800/50">
                          Enrolled
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDispatchSingleStudentEmail(st)}
                          disabled={isDispatching}
                          title="Send credentials email to this student"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 hover:text-blue-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[11px] font-semibold">Send Email</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No students found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: FACULTY DIRECTORY MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'faculty' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search faculty by name, ID, department..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleShowAllPasswords}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title={showAllPasswords ? "Hide all default passwords" : "Show all default passwords"}
              >
                {showAllPasswords ? <EyeOff className="w-3.5 h-3.5 text-teal-600" /> : <Eye className="w-3.5 h-3.5 text-teal-600" />}
                <span>{showAllPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>

              <button
                onClick={handleDispatchAllFacultyEmail}
                disabled={isDispatching || faculty.length === 0}
                title="Dispatch login credentials to all faculty members via email"
                className="px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Dispatch All to Email</span>
              </button>

              <button
                onClick={() => setIsAddFacultyOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Faculty Member</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Faculty ID</th>
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Default Password</th>
                  <th className="py-3 px-4">Assigned Slots</th>
                  <th className="py-3 px-4">Privileges</th>
                  <th className="py-3 px-4 text-right">Credentials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFaculty.length > 0 ? (
                  filteredFaculty.map((fac, idx) => (
                    <tr key={fac.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {fac.facultyId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{fac.name}</div>
                        <div className="text-[11px] text-slate-400">{fac.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {fac.department}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {fac.designation}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-all">
                            {revealedPasswords[fac.id || fac.facultyId || fac.email] || showAllPasswords
                              ? (fac.password || 'faculty123')
                              : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(fac.id || fac.facultyId || fac.email)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded cursor-pointer"
                            title={revealedPasswords[fac.id || fac.facultyId || fac.email] || showAllPasswords ? "Hide password" : "Show password"}
                          >
                            {revealedPasswords[fac.id || fac.facultyId || fac.email] || showAllPasswords ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(fac.id || fac.facultyId || fac.email, fac.password || 'faculty123')}
                            className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors rounded cursor-pointer"
                            title="Copy password"
                          >
                            {copiedPasswordId === (fac.id || fac.facultyId || fac.email) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold font-mono">
                          {fac.assignedSlotsCount || 1} GD Slots
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800/50">
                          Authorized Observer
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDispatchSingleFacultyEmail(fac)}
                          disabled={isDispatching}
                          title="Send credentials email to this faculty member"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-600 hover:text-teal-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-[11px] font-semibold">Send Email</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No faculty members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: GD SLOT SCHEDULER */}
      {/* ==================================================== */}
      {activeTab === 'slots' && (
        selectedReportSlotId ? (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                onClick={() => setSelectedReportSlotId('')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to GD Slot Scheduler</span>
              </button>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                Completed GD Evaluation Report
              </span>
            </div>

            <SlotStudentReportsView
              key={selectedReportSlotId}
              slotId={selectedReportSlotId}
              slotData={displaySlots.find((s) => s.id === selectedReportSlotId)}
              collegeName={stats.collegeName}
              onBack={() => setSelectedReportSlotId('')}
            />
          </div>
        ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                Scheduled Discussion Slots
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Created slots run with autonomous AI facilitation and are assigned to faculty observers.
              </p>
            </div>
            <button
              onClick={() => {
                if (onOpenCreateSession) {
                  onOpenCreateSession();
                } else {
                  setIsScheduleSlotOpen(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySlots.map((sl, idx) => (
              <div
                key={sl.id || idx}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-amber-500/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatSlotDate(sl.slotDate)}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{sl.slotTiming || '10:30 AM - 10:45 AM'}</span>
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        sl.status === 'completed'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : sl.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {sl.status}
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-snug mb-1.5">
                    {sl.slotName || sl.topic}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {sl.description || sl.topic}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned Evaluator:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{sl.assignedFacultyName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-semibold">{sl.durationMinutes || 15} Minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Participants:</span>
                      <span className="font-semibold">{sl.enrolledCount ?? 0} / {sl.maxCapacity || 15} Students</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleDeleteSlot(sl)}
                    disabled={sl.status === 'active' || loading}
                    className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={sl.status === 'active' ? 'End the active GD before deleting it' : 'Delete this GD slot'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                  {sl.status === 'completed' ? (
                    <>
                      <button
                        onClick={() => setSelectedReportSlotId(sl.id)}
                        className="flex-1 py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate shadow-2xs"
                        title="View student evaluation reports for this completed slot"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Student Reports</span>
                      </button>
                      {onEnterGDRoom && (
                        <button
                          onClick={() => onEnterGDRoom((sl as any).rawSession || sl)}
                          className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer truncate"
                          title="View overall session analytics, student scores, and cohort performance"
                        >
                          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Analytics</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center justify-center gap-1.5 text-center truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="truncate">Faculty Evaluator</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD STUDENT */}
      {/* ==================================================== */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-600" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  Add Student to Roster
                </h3>
              </div>
              <button onClick={() => setIsAddStudentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g. Vikram Malhotra"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Student Institutional Email</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="e.g. vikram.m@college.edu.in"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Student Roll / ID</label>
                  <input
                    type="text"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                    placeholder="STU-2024-301"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Batch</label>
                  <input
                    type="text"
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                    placeholder="2024-2028"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Seat (1–15)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={newStudent.seatNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, seatNumber: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Course / Specialization</label>
                <input
                  type="text"
                  value={newStudent.course}
                  onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                  placeholder="B.Tech Computer Science & Engineering"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Assigned Password</label>
                  <button
                    type="button"
                    onClick={() => setNewStudent({ ...newStudent, password: `Stud@${Math.floor(1000 + Math.random() * 9000)}!` })}
                    className="text-[11px] text-amber-600 hover:underline cursor-pointer"
                  >
                    Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    placeholder="e.g. Stud@1024!"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="send-student-email-checkbox"
                  checked={newStudent.sendEmail}
                  onChange={(e) => setNewStudent({ ...newStudent, sendEmail: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="send-student-email-checkbox" className="text-[11px] text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                  Dispatch login credentials to student's email immediately
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: BULK CSV UPLOAD */}
      {/* ==================================================== */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  Bulk Student Import (CSV)
                </h3>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">Standard CSV Format</div>
                  <div className="text-slate-500 text-[11px]">Name, Email, StudentID, Course, Batch, SeatNumber</div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Upload Student Roster CSV File
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Upload your institutional batch file to register multiple participants instantly.
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Parsed Preview ({csvPreview.length} Students)</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Valid Format</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {csvPreview.map((p, i) => (
                      <div key={i} className="p-2 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold">{p.name}</span> • <span className="text-slate-400">{p.email}</span>
                        </div>
                        <span className="font-mono text-indigo-600">{p.studentId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={csvPreview.length === 0 || loading}
                  onClick={handleUploadCsvSubmit}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Importing...' : `Import ${csvPreview.length} Students`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD FACULTY */}
      {/* ==================================================== */}
      {isAddFacultyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  Add Faculty Evaluator
                </h3>
              </div>
              <button onClick={() => setIsAddFacultyOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFacultySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  placeholder="e.g. Dr. Harish Chandra"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Institutional Email</label>
                <input
                  type="email"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  placeholder="e.g. harish.c@college.edu.in"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Faculty ID</label>
                  <input
                    type="text"
                    value={newFaculty.facultyId}
                    onChange={(e) => setNewFaculty({ ...newFaculty, facultyId: e.target.value })}
                    placeholder="FAC-CSE-105"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                    placeholder="Associate Professor"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Department</label>
                <input
                  type="text"
                  value={newFaculty.department}
                  onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                  placeholder="Computer Science & Engineering"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Assigned Password</label>
                  <button
                    type="button"
                    onClick={() => setNewFaculty({ ...newFaculty, password: `Fac@${Math.floor(1000 + Math.random() * 9000)}!` })}
                    className="text-[11px] text-teal-600 hover:underline cursor-pointer"
                  >
                    Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newFaculty.password}
                    onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                    placeholder="e.g. Fac@2026!"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="send-faculty-email-checkbox"
                  checked={newFaculty.sendEmail}
                  onChange={(e) => setNewFaculty({ ...newFaculty, sendEmail: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="send-faculty-email-checkbox" className="text-[11px] text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                  Dispatch login credentials to faculty's email immediately
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFacultyOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
                >
                  Register Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SCHEDULE NEW GD SLOT */}
      {/* ==================================================== */}
      {isScheduleSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  Schedule New GD Slot
                </h3>
              </div>
              <button onClick={() => setIsScheduleSlotOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSlotSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Slot Name / Batch</label>
                <input
                  type="text"
                  value={newSlot.slotName}
                  onChange={(e) => setNewSlot({ ...newSlot, slotName: e.target.value })}
                  placeholder="e.g. Slot 3: Engineering Placement Round"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Discussion Topic</label>
                <textarea
                  rows={2}
                  value={newSlot.topic}
                  onChange={(e) => setNewSlot({ ...newSlot, topic: e.target.value })}
                  placeholder="Enter the debate or discussion topic..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Scheduled Date</span>
                  </label>
                  <input
                    type="date"
                    value={newSlot.slotDate}
                    onChange={(e) => setNewSlot({ ...newSlot, slotDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Scheduled Timing</span>
                  </label>
                  <input
                    type="text"
                    value={newSlot.slotTiming}
                    onChange={(e) => setNewSlot({ ...newSlot, slotTiming: e.target.value })}
                    placeholder="11:30 AM - 11:45 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newSlot.durationMinutes}
                    onChange={(e) => setNewSlot({ ...newSlot, durationMinutes: parseInt(e.target.value, 10) || 15 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Assign Faculty Evaluator (Observer)
                </label>
                <select
                  value={newSlot.assignedFacultyId}
                  onChange={(e) => {
                    const sel = faculty.find((f) => f.facultyId === e.target.value);
                    setNewSlot({
                      ...newSlot,
                      assignedFacultyId: e.target.value,
                      assignedFacultyName: sel?.name || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  {faculty.map((f) => (
                    <option key={f.facultyId} value={f.facultyId}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Number of Students for this GD Session</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {newSlot.participantCount} Students
                  </span>
                </div>

                {/* Quick Capacity Presets */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Select:</span>
                  {[4, 6, 8, 10, 12, 15].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNewSlot({ ...newSlot, participantCount: count })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        newSlot.participantCount === count
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                {/* Custom Number Input & Slider */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-8">
                    <input
                      type="range"
                      min={2}
                      max={15}
                      value={newSlot.participantCount}
                      onChange={(e) => setNewSlot({ ...newSlot, participantCount: parseInt(e.target.value, 10) || 8 })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 px-0.5 -mt-1 font-mono">
                      <span>2 (Min)</span>
                      <span>8 (Recommended)</span>
                      <span>15 (Max)</span>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <div className="relative">
                      <input
                        type="number"
                        min={2}
                        max={15}
                        value={newSlot.participantCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setNewSlot({ ...newSlot, participantCount: Math.max(2, Math.min(15, val)) });
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs text-center font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                        seats
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Roster Allocation Preview Note */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                  {students.length >= newSlot.participantCount ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>{newSlot.participantCount} registered students</strong> will be seated (Seats 1 to {newSlot.participantCount}) from your enrolled roster.</span>
                    </span>
                  ) : students.length > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>{students.length} registered students</strong> + <strong>{newSlot.participantCount - students.length} AI peer personas</strong> will be seated to fill all {newSlot.participantCount} seats.</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>All <strong>{newSlot.participantCount} seats</strong> will be filled by Indian English AI peer personas with automated multi-turn debate.</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleSlotOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
