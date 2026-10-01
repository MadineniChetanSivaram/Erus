import { GDSession, Student, TranscriptEntry, StudentAssessmentReport, GradeLevel } from '../types/gd';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    name: 'Aarav Mehta',
    seatNumber: 1,
    college: 'Engineering Institute',
    course: 'B.Tech CSE',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: false,
    speakingDurationSeconds: 160,
    speakingTurns: 4,
    interruptionCount: 0,
    questionsAnswered: 3,
    questionsInitiated: 2,
    sentiment: 'positive',
  },
  {
    id: 's2',
    name: 'Priya Sharma',
    seatNumber: 2,
    college: 'Institute of Technology',
    course: 'B.Tech IT',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 185,
    speakingTurns: 5,
    interruptionCount: 1,
    questionsAnswered: 3,
    questionsInitiated: 3,
    sentiment: 'enthusiastic',
  },
  {
    id: 's3',
    name: 'Ramesh Patel',
    seatNumber: 3,
    college: 'National Engineering College',
    course: 'B.Tech ECE',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 130,
    speakingTurns: 3,
    interruptionCount: 0,
    questionsAnswered: 2,
    questionsInitiated: 0,
    sentiment: 'neutral',
  },
  {
    id: 's4',
    name: 'Sneha Reddy',
    seatNumber: 4,
    college: 'University College of Engineering',
    course: 'B.Tech AI & DS',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 175,
    speakingTurns: 4,
    interruptionCount: 0,
    questionsAnswered: 3,
    questionsInitiated: 2,
    sentiment: 'positive',
  },
  {
    id: 's5',
    name: 'Vikram Joshi',
    seatNumber: 5,
    college: 'Technology Campus',
    course: 'B.Tech Mechanical',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 140,
    speakingTurns: 3,
    interruptionCount: 1,
    questionsAnswered: 2,
    questionsInitiated: 1,
    sentiment: 'neutral',
  },
  {
    id: 's6',
    name: 'Ananya Verma',
    seatNumber: 6,
    college: 'Regional Tech Institute',
    course: 'B.Tech AI & ML',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 155,
    speakingTurns: 4,
    interruptionCount: 0,
    questionsAnswered: 3,
    questionsInitiated: 1,
    sentiment: 'enthusiastic',
  },
  {
    id: 's7',
    name: 'Rohan Gupta',
    seatNumber: 7,
    college: 'State Technical University',
    course: 'B.Tech CSE',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 120,
    speakingTurns: 3,
    interruptionCount: 0,
    questionsAnswered: 2,
    questionsInitiated: 1,
    sentiment: 'neutral',
  },
  {
    id: 's8',
    name: 'Meera Iyer',
    seatNumber: 8,
    college: 'Apex Engineering Academy',
    course: 'B.Tech Biotechnology',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 165,
    speakingTurns: 4,
    interruptionCount: 0,
    questionsAnswered: 2,
    questionsInitiated: 2,
    sentiment: 'positive',
  },
  {
    id: 's9',
    name: 'Arjun Nair',
    seatNumber: 9,
    college: 'National Tech Academy',
    course: 'B.Tech EEE',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 110,
    speakingTurns: 2,
    interruptionCount: 0,
    questionsAnswered: 1,
    questionsInitiated: 1,
    sentiment: 'positive',
  },
  {
    id: 's10',
    name: 'Divya Balaji',
    seatNumber: 10,
    college: 'City Institute of Science',
    course: 'B.Tech CSE',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 145,
    speakingTurns: 3,
    interruptionCount: 0,
    questionsAnswered: 2,
    questionsInitiated: 1,
    sentiment: 'enthusiastic',
  },
  {
    id: 's11',
    name: 'Tanmay Kulkarni',
    seatNumber: 11,
    college: 'Premier Engineering College',
    course: 'B.Tech Mechanical',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 130,
    speakingTurns: 3,
    interruptionCount: 0,
    questionsAnswered: 1,
    questionsInitiated: 1,
    sentiment: 'neutral',
  },
  {
    id: 's12',
    name: 'Ritu Sengupta',
    seatNumber: 12,
    college: 'Heritage Institute',
    course: 'B.Tech IT',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 150,
    speakingTurns: 3,
    interruptionCount: 0,
    questionsAnswered: 2,
    questionsInitiated: 1,
    sentiment: 'positive',
  },
  {
    id: 's13',
    name: 'Varun Mehta',
    seatNumber: 13,
    college: 'Tech University Campus',
    course: 'B.Tech Mechatronics',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 125,
    speakingTurns: 2,
    interruptionCount: 0,
    questionsAnswered: 1,
    questionsInitiated: 1,
    sentiment: 'neutral',
  },
  {
    id: 's14',
    name: 'Pooja Chawla',
    seatNumber: 14,
    college: 'Modern Institute of Tech',
    course: 'B.Tech Software Engg',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 160,
    speakingTurns: 4,
    interruptionCount: 0,
    questionsAnswered: 3,
    questionsInitiated: 2,
    sentiment: 'enthusiastic',
  },
  {
    id: 's15',
    name: 'Siddharth Menon',
    seatNumber: 15,
    college: 'Central Technological Institute',
    course: 'B.Tech CSE',
    batch: '2024-2028',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    isUser: false,
    micActive: false,
    isSpeaking: false,
    hasRaisedHand: false,
    cameraActive: true,
    speakingDurationSeconds: 170,
    speakingTurns: 4,
    interruptionCount: 0,
    questionsAnswered: 3,
    questionsInitiated: 2,
    sentiment: 'positive',
  },
];

export function generateSlotParticipants(
  count: number = 8,
  userStudent?: { id?: string; name?: string; college?: string; course?: string }
): Student[] {
  const targetCount = Math.max(1, count || 8);
  const result: Student[] = [];

  for (let i = 0; i < targetCount; i++) {
    const template = INITIAL_STUDENTS[i % INITIAL_STUDENTS.length];
    const seatNum = i + 1;
    const isUser = i === 0 && !!userStudent?.name;

    result.push({
      ...template,
      id: isUser && userStudent?.id ? userStudent.id : `slot-stu-${seatNum}`,
      name: isUser && userStudent?.name ? userStudent.name : template.name,
      college: isUser && userStudent?.college ? userStudent.college : template.college,
      course: isUser && userStudent?.course ? userStudent.course : template.course,
      seatNumber: seatNum,
      isUser,
      micActive: false,
      isSpeaking: false,
      hasRaisedHand: false,
      cameraActive: !isUser,
      speakingDurationSeconds: Math.floor(Math.random() * 60) + 40,
      speakingTurns: Math.floor(Math.random() * 3) + 1,
      interruptionCount: 0,
      questionsAnswered: 1,
      questionsInitiated: 1,
      sentiment: template.sentiment || 'neutral',
      isEmptySeat: false,
    });
  }

  return result;
}

export const INITIAL_TRANSCRIPTS: TranscriptEntry[] = [];

export interface FacultyMemberInfo {
  id: string;
  name: string;
  email: string;
  facultyId: string;
  department: string;
  designation: string;
  avatar?: string;
}

export const INSTITUTIONAL_FACULTY: FacultyMemberInfo[] = [];

export const DEFAULT_GD_SESSION: GDSession = {
  id: 'session-default',
  slotName: 'General GD Session',
  slotTiming: '',
  slotDate: 'Today',
  enrolledCount: 0,
  maxCapacity: 15,
  roomLayout: 'round_table',
  assignedFacultyId: '',
  assignedFacultyName: '',
  assignedFacultyDept: '',
  assignedFacultyEmail: '',
  topic: 'General Discussion',
  description: 'Group Discussion Room',
  durationMinutes: 25,
  difficulty: 'Intermediate',
  assessmentRubric: 'Standard Academic 7-Parameter Rubric',
  status: 'waiting',
  students: [],
  currentPhase: 'intro',
  facilitatorSpeech: 'Welcome to the Group Discussion. The floor is open.',
  facilitatorAction: 'Discussion room active',
  isFacilitatorSpeaking: false,
  silenceTimerSeconds: 0,
  currentSpeakerId: null,
  breakoutRooms: [],
  createdAt: new Date().toISOString(),
};

export const INITIAL_SLOTS: GDSession[] = [];

export const INITIAL_SESSION: GDSession = DEFAULT_GD_SESSION;

export function calculateGrade(score: number): GradeLevel {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Improvement';
}

export function computeOverallScore(skills: {
  english: number;        // out of 20
  fluency: number;        // out of 20
  clarity: number;        // out of 15
  confidence: number;     // out of 15
  contentQuality: number; // out of 15
  collaboration: number;  // out of 10
  leadership: number;     // out of 5
}): number {
  // Score formula: English (20%) + Fluency (20%) + Clarity (15%) + Confidence (15%) + Content (15%) + Collaboration (10%) + Leadership (5%)
  // Sum = 20 + 20 + 15 + 15 + 15 + 10 + 5 = 100 max
  const total =
    skills.english +
    skills.fluency +
    skills.clarity +
    skills.confidence +
    skills.contentQuality +
    skills.collaboration +
    skills.leadership;
  return Math.min(100, Math.max(0, Math.round(total)));
}

export function generateStudentReport(
  student: Student,
  topic: string,
  durationMinutes: number = 20,
  baseReport?: StudentAssessmentReport
): StudentAssessmentReport {
  const base = baseReport || SAMPLE_REPORT_RAHUL;
  const turns = student.speakingTurns || 4;
  const durationSec = student.speakingDurationSeconds || 180;

  const english = Math.min(20, Math.max(14, Math.round(16 + (turns % 3))));
  const fluency = Math.min(20, Math.max(13, Math.round(15 + ((durationSec / 45) % 4))));
  const clarity = Math.min(15, Math.max(10, Math.round(12 + ((student.questionsAnswered || 2) % 3))));
  const confidence = Math.min(15, Math.max(11, Math.round(13 + ((student.questionsInitiated || 1) % 3))));
  const content = Math.min(15, Math.max(10, Math.round(12 + ((turns * 2) % 3))));
  const collaboration = Math.min(10, Math.max(7, Math.round(8 - (student.interruptionCount || 0))));
  const leadership = Math.min(5, Math.max(3, Math.round(4 + ((student.questionsInitiated || 0) > 0 ? 1 : 0))));

  const overall = computeOverallScore({
    english,
    fluency,
    clarity,
    confidence,
    contentQuality: content,
    collaboration,
    leadership,
  });

  return {
    ...base,
    id: `rep-${student.id}-${Date.now()}`,
    sessionId: 'session-001',
    studentId: student.id,
    studentName: student.name,
    college: student.college || 'Engineering Institute',
    topic,
    durationMinutes,
    speakingTimeFormatted: `${Math.floor(durationSec / 60)} min ${durationSec % 60} sec`,
    speakingTimeSeconds: durationSec,
    speakingTurns: turns,
    interruptions: student.interruptionCount || 0,
    questionsAnswered: student.questionsAnswered || 3,
    wpm: baseReport?.wpm || 135,
    wpmStatus: baseReport?.wpmStatus || 'Optimal',
    fillerWordsCount: baseReport?.fillerWordsCount ?? 2,
    fillerWordsBreakdown: baseReport?.fillerWordsBreakdown || [
      { word: 'like', count: 1 },
      { word: 'basically', count: 1 },
    ],
    facultyEndorsement: baseReport?.facultyEndorsement || {
      endorsed: false,
    },
    skills: {
      english: { ...base.skills.english, score: english },
      fluency: { ...base.skills.fluency, score: fluency },
      clarity: { ...base.skills.clarity, score: clarity },
      confidence: { ...base.skills.confidence, score: confidence },
      contentQuality: { ...base.skills.contentQuality, score: content },
      collaboration: { ...base.skills.collaboration, score: collaboration },
      leadership: { ...base.skills.leadership, score: leadership },
    },
    overallScore: overall,
    grade: calculateGrade(overall),
    aiSummary: `${student.name} contributed actively to the group discussion on "${topic}", demonstrating constructive dialogue and structured reasoning.`,
    generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

export const SAMPLE_REPORT_RAHUL: StudentAssessmentReport = {
  id: '',
  sessionId: '',
  studentId: '',
  studentName: 'Participant',
  college: 'Institution',
  topic: 'Group Discussion',
  durationMinutes: 15,
  speakingTimeFormatted: '0 min 0 sec',
  speakingTimeSeconds: 0,
  speakingTurns: 0,
  interruptions: 0,
  questionsAnswered: 0,
  questionsInitiated: 0,
  wpm: 0,
  wpmStatus: 'Optimal',
  fillerWordsCount: 0,
  fillerWordsBreakdown: [],
  facultyEndorsement: {
    endorsed: false,
  },
  skills: {
    english: {
      parameter: 'Speaking in English',
      weightagePercent: 20,
      score: 0,
      maxScore: 20,
      subPoints: ['Use of English', 'Sentence formation', 'Grammar usage', 'Vocabulary'],
      feedback: 'Awaiting session evaluation.',
    },
    fluency: {
      parameter: 'Fluency',
      weightagePercent: 20,
      score: 0,
      maxScore: 20,
      subPoints: ['Continuous speaking', 'Reduced hesitation', 'Reduced fillers', 'Natural flow'],
      feedback: 'Awaiting session evaluation.',
    },
    clarity: {
      parameter: 'Communication Clarity',
      weightagePercent: 15,
      score: 0,
      maxScore: 15,
      subPoints: ['Clear ideas', 'Proper explanations', 'Understandable speech'],
      feedback: 'Awaiting session evaluation.',
    },
    confidence: {
      parameter: 'Confidence',
      weightagePercent: 15,
      score: 0,
      maxScore: 15,
      subPoints: ['Initiating discussion', 'Responding confidently', 'Handling questions'],
      feedback: 'Awaiting session evaluation.',
    },
    contentQuality: {
      parameter: 'Content Quality',
      weightagePercent: 15,
      score: 0,
      maxScore: 15,
      subPoints: ['Relevance', 'Logical reasoning', 'Examples', 'Supporting arguments'],
      feedback: 'Awaiting session evaluation.',
    },
    collaboration: {
      parameter: 'Collaboration',
      weightagePercent: 10,
      score: 0,
      maxScore: 10,
      subPoints: ['Respect for others', 'Listening skills', 'Encouraging others', 'Team behavior'],
      feedback: 'Awaiting session evaluation.',
    },
    leadership: {
      parameter: 'Leadership',
      weightagePercent: 5,
      score: 0,
      maxScore: 5,
      subPoints: ['Guiding discussion', 'Summarizing points', 'Conflict management'],
      feedback: 'Awaiting session evaluation.',
    },
  },
  overallScore: 0,
  grade: 'Needs Improvement',
  strengths: [],
  areasForImprovement: [],
  aiRecommendations: [],
  aiSummary: 'No evaluation report generated yet. Participate in a Group Discussion session to receive your personalized AI evaluation.',
  generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
};

export const TOPIC_PRESETS = [
  {
    topic: 'Should Artificial Intelligence replace teachers?',
    category: 'Education & AI',
    difficulty: 'Intermediate',
    description: 'Debating AI personalized learning vs human mentorship, empathy, and ethical holistic education.',
    starterPrompt: 'How can AI revolutionize tutoring while preserving the foundational emotional bond between teachers and students?',
  },
  {
    topic: 'Electric Vehicles vs Hydrogen Fuel Cells: The Future of Mobility',
    category: 'Sustainability & Tech',
    difficulty: 'Advanced',
    description: 'Analyzing battery infrastructure, environmental life-cycle emissions, and commercial feasibility.',
    starterPrompt: 'Which powertrain holds the greatest promise for heavy-duty freight and urban mass transit?',
  },
  {
    topic: 'Remote Work vs In-Office: Impact on Corporate Innovation',
    category: 'Workplace & Society',
    difficulty: 'Beginner',
    description: 'Examining asynchronous productivity, serendipitous hallway innovation, and work-life harmony.',
    starterPrompt: 'Do hybrid policies strike the optimal balance or create fragmented organizational culture?',
  },
  {
    topic: 'Are Social Media Algorithms eroding Civil Discourse & Critical Thinking?',
    category: 'Media & Psychology',
    difficulty: 'Intermediate',
    description: 'Investigating echo chambers, polarization, attention spans, and regulatory frameworks.',
    starterPrompt: 'What ethical boundaries should platform architects adhere to when optimizing recommendation algorithms?',
  },
];
