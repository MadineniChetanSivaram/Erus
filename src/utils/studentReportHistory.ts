import { StudentAssessmentReport, GradeLevel } from '../types/gd';

const HISTORY_PREFIX = 'erus_student_gd_history_v1_';

export interface ReportComparisonDelta {
  overallScoreDelta: number;
  overallScorePercent: number;
  speakingTimeSecondsDelta: number;
  speakingTurnsDelta: number;
  interruptionsDelta: number;
  wpmDelta: number;
  fillerWordsDelta: number;
  skillDeltas: {
    english: number;
    fluency: number;
    clarity: number;
    confidence: number;
    contentQuality: number;
    collaboration: number;
    leadership: number;
  };
  improvedSkills: string[];
  declinedSkills: string[];
  steadySkills: string[];
  topGainParameter: string;
  topRoomForGrowth: string;
}

export function getStorageKey(studentKey: string): string {
  const clean = studentKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${HISTORY_PREFIX}${clean}`;
}

export function createBaselinePreviousReport(currentReport: StudentAssessmentReport): StudentAssessmentReport {
  // Construct a realistic diagnostic previous session held 5 days earlier
  const prevDate = new Date();
  prevDate.setDate(prevDate.getDate() - 5);
  const prevDateString = prevDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    ...currentReport,
    id: `rep-prev-${currentReport.studentId || 'stu'}-001`,
    sessionId: 'session-prev-100',
    topic: currentReport.topic || 'Group Discussion Session',
    durationMinutes: 20,
    generatedAt: prevDateString,
    speakingTimeFormatted: '2 min 45 sec',
    speakingTimeSeconds: 165,
    speakingTurns: Math.max(2, (currentReport.speakingTurns || 5) - 2),
    interruptions: Math.min(3, (currentReport.interruptions || 0) + 2),
    questionsAnswered: Math.max(1, (currentReport.questionsAnswered || 3) - 1),
    wpm: Math.max(105, (currentReport.wpm || 135) - 18),
    wpmStatus: 'Too Slow',
    fillerWordsCount: Math.max(6, (currentReport.fillerWordsCount || 2) + 8),
    fillerWordsBreakdown: [
      { word: 'like', count: 4 },
      { word: 'basically', count: 3 },
      { word: 'um/uh', count: 3 },
    ],
    facultyEndorsement: {
      endorsed: false,
      facultyName: currentReport.facultyEndorsement?.facultyName || 'Faculty Evaluator',
      facultyId: currentReport.facultyEndorsement?.facultyId || 'FAC-001',
      designation: currentReport.facultyEndorsement?.designation || 'Faculty In-Charge',
      remarks: 'Initial diagnostic assessment. Student exhibited structured reasoning and active dialogue.',
      endorsedAt: prevDateString,
    },
    skills: {
      english: {
        ...(currentReport.skills?.english || { parameter: 'Speaking in English', weightagePercent: 20, score: 16, maxScore: 20, subPoints: ['Vocabulary', 'Structure'], feedback: '' }),
        score: Math.max(12, ((currentReport.skills?.english?.score ?? 16) - 2)),
        feedback: 'Good conversational grasp, occasionally searched for business vocabulary.',
      },
      fluency: {
        ...(currentReport.skills?.fluency || { parameter: 'Fluency', weightagePercent: 20, score: 15, maxScore: 20, subPoints: ['Pacing', 'Flow'], feedback: '' }),
        score: Math.max(11, ((currentReport.skills?.fluency?.score ?? 15) - 3)),
        feedback: 'Pauses occurred when transitioning between points with 10+ filler words recorded.',
      },
      clarity: {
        ...(currentReport.skills?.clarity || { parameter: 'Communication Clarity', weightagePercent: 15, score: 12, maxScore: 15, subPoints: ['Clear ideas'], feedback: '' }),
        score: Math.max(10, ((currentReport.skills?.clarity?.score ?? 12) - 1)),
        feedback: 'Main premise was understandable; supporting reasoning was brief.',
      },
      confidence: {
        ...(currentReport.skills?.confidence || { parameter: 'Confidence', weightagePercent: 15, score: 12, maxScore: 15, subPoints: ['Body Language'], feedback: '' }),
        score: Math.max(9, ((currentReport.skills?.confidence?.score ?? 12) - 2)),
        feedback: 'Hesitated to challenge counter-arguments; waited for moderator prompts.',
      },
      contentQuality: {
        ...(currentReport.skills?.contentQuality || { parameter: 'Content Quality', weightagePercent: 15, score: 12, maxScore: 15, subPoints: ['Relevance'], feedback: '' }),
        score: Math.max(9, ((currentReport.skills?.contentQuality?.score ?? 12) - 1)),
        feedback: 'Relied on general observations rather than empirical industry case studies.',
      },
      collaboration: {
        ...(currentReport.skills?.collaboration || { parameter: 'Collaboration', weightagePercent: 10, score: 8, maxScore: 10, subPoints: ['Listening'], feedback: '' }),
        score: Math.max(6, ((currentReport.skills?.collaboration?.score ?? 8) - 1)),
        feedback: 'Listened politely; could actively invite quiet peers more consistently.',
      },
      leadership: {
        ...(currentReport.skills?.leadership || { parameter: 'Leadership', weightagePercent: 5, score: 4, maxScore: 5, subPoints: ['Initiative'], feedback: '' }),
        score: Math.max(2, ((currentReport.skills?.leadership?.score ?? 4) - 1)),
        feedback: 'Observed discussion flow without initiating mid-session summaries.',
      },
    },
    overallScore: Math.max(0, currentReport.overallScore - 10),
    grade: (currentReport.overallScore - 10 >= 90 ? 'Excellent' : currentReport.overallScore - 10 >= 75 ? 'Very Good' : currentReport.overallScore - 10 >= 60 ? 'Good' : currentReport.overallScore - 10 >= 40 ? 'Average' : 'Needs Improvement') as GradeLevel,
    strengths: [
      'Showed strong commitment to listening respectfully to opposing perspectives',
      'Communicated consistently in English without switching languages',
    ],
    areasForImprovement: [
      'High incidence of vocal fillers (like, basically, um) under pressure',
      'Speaking rate of 115 WPM is slower than the 120-150 WPM optimal professional band',
      'Hesitation when initiating opening remarks or counter-arguments',
    ],
    aiRecommendations: [
      'Practice 2-minute timed impromptu speeches focusing on vocal breath pacing',
      'Pre-read Harvard Business Review / Mint op-eds for structured debate frameworks',
    ],
    aiSummary: 'Student demonstrated sound ethical reasoning with room for increased vocal confidence and faster conversational cadence.',
  };
}

export function getStudentReportHistory(studentIdentifier: string, currentReport?: StudentAssessmentReport): StudentAssessmentReport[] {
  try {
    const key = getStorageKey(studentIdentifier);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load report history:', e);
  }

  // If no stored history and currentReport is provided, initialize with current report only
  if (currentReport) {
    const initialHistory = [currentReport];
    saveStudentReportHistory(studentIdentifier, initialHistory);
    return initialHistory;
  }

  return [];
}

export function saveStudentReportHistory(studentIdentifier: string, reports: StudentAssessmentReport[]): void {
  try {
    const key = getStorageKey(studentIdentifier);
    localStorage.setItem(key, JSON.stringify(reports));
  } catch (e) {
    console.warn('Failed to save report history:', e);
  }
}

export function addReportToStudentHistory(report: StudentAssessmentReport): StudentAssessmentReport[] {
  const studentKey = report.studentName || report.studentId || 'student';
  const existing = getStudentReportHistory(studentKey);

  // Check if report already exists in history (same id or same session & topic)
  const existingIndex = existing.findIndex((r) => r.id === report.id || (r.sessionId === report.sessionId && r.topic === report.topic));
  
  let updated: StudentAssessmentReport[];
  if (existingIndex >= 0) {
    // Update existing report
    updated = [...existing];
    updated[existingIndex] = report;
  } else {
    // Prepend new report so index 0 is always the most recent (Current GD)
    updated = [report, ...existing];
  }

  saveStudentReportHistory(studentKey, updated);
  return updated;
}

export function computeComparisonDelta(
  current: StudentAssessmentReport,
  previous: StudentAssessmentReport
): ReportComparisonDelta {
  const overallScoreDelta = current.overallScore - previous.overallScore;
  const overallScorePercent = previous.overallScore > 0
    ? Math.round(((current.overallScore - previous.overallScore) / previous.overallScore) * 1000) / 10
    : 0;

  const speakingTimeSecondsDelta = (current.speakingTimeSeconds || 0) - (previous.speakingTimeSeconds || 0);
  const speakingTurnsDelta = (current.speakingTurns || 0) - (previous.speakingTurns || 0);
  const interruptionsDelta = (current.interruptions || 0) - (previous.interruptions || 0);
  const wpmDelta = (current.wpm || 135) - (previous.wpm || 115);
  const fillerWordsDelta = (current.fillerWordsCount ?? 2) - (previous.fillerWordsCount ?? 10);

  const skillDeltas = {
    english: (current.skills?.english?.score ?? 15) - (previous.skills?.english?.score ?? 14),
    fluency: (current.skills?.fluency?.score ?? 15) - (previous.skills?.fluency?.score ?? 13),
    clarity: (current.skills?.clarity?.score ?? 12) - (previous.skills?.clarity?.score ?? 11),
    confidence: (current.skills?.confidence?.score ?? 12) - (previous.skills?.confidence?.score ?? 11),
    contentQuality: (current.skills?.contentQuality?.score ?? 12) - (previous.skills?.contentQuality?.score ?? 11),
    collaboration: (current.skills?.collaboration?.score ?? 8) - (previous.skills?.collaboration?.score ?? 7),
    leadership: (current.skills?.leadership?.score ?? 4) - (previous.skills?.leadership?.score ?? 3),
  };

  const improvedSkills: string[] = [];
  const declinedSkills: string[] = [];
  const steadySkills: string[] = [];

  const labels: Record<keyof typeof skillDeltas, string> = {
    english: 'Speaking in English',
    fluency: 'Fluency & Articulation',
    clarity: 'Communication Clarity',
    confidence: 'Confidence & Assertiveness',
    contentQuality: 'Content Quality & Depth',
    collaboration: 'Active Listening & Collaboration',
    leadership: 'Leadership & Moderation',
  };

  let maxGain = -999;
  let topGainParam = 'Fluency & Articulation';
  let maxRoom = -999;
  let topRoomParam = 'Leadership & Moderation';

  (Object.keys(skillDeltas) as (keyof typeof skillDeltas)[]).forEach((k) => {
    const delta = skillDeltas[k];
    const paramName = labels[k];
    if (delta > 0) improvedSkills.push(paramName);
    else if (delta < 0) declinedSkills.push(paramName);
    else steadySkills.push(paramName);

    if (delta > maxGain) {
      maxGain = delta;
      topGainParam = paramName;
    }

    const currentSkill = current.skills?.[k];
    const room = (currentSkill?.maxScore || 20) - (currentSkill?.score || 0);
    if (room > maxRoom) {
      maxRoom = room;
      topRoomParam = paramName;
    }
  });

  return {
    overallScoreDelta,
    overallScorePercent,
    speakingTimeSecondsDelta,
    speakingTurnsDelta,
    interruptionsDelta,
    wpmDelta,
    fillerWordsDelta,
    skillDeltas,
    improvedSkills,
    declinedSkills,
    steadySkills,
    topGainParameter: topGainParam,
    topRoomForGrowth: topRoomParam,
  };
}
