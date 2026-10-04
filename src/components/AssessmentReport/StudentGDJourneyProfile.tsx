import React from 'react';
import { 
  Award, 
  TrendingUp, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight, 
  BookOpen, 
  MessageSquare, 
  Brain, 
  Users, 
  Volume2, 
  Zap, 
  ShieldCheck, 
  Compass, 
  ArrowLeft,
  Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area 
} from 'recharts';
import { StudentAssessmentReport } from '../../types/gd';
import { AuthUser } from '../../types/auth';
import { downloadStudentReport, StudentReportType } from '../../utils/managementReports';

interface StudentGDJourneyProfileProps {
  currentReport: StudentAssessmentReport;
  currentUser?: AuthUser | null;
  onBackToSessionReport: () => void;
}

export const StudentGDJourneyProfile: React.FC<StudentGDJourneyProfileProps> = ({
  currentReport,
  currentUser,
  onBackToSessionReport,
}) => {
  const studentName = currentReport.studentName || currentUser?.name || 'Rahul Sharma';
  const collegeName = currentReport.college || currentUser?.college || 'BMS Institute of Technology & Management';
  const studentId = currentReport.studentId || currentUser?.id || 'STU-2024-001';

  // 9-Dimension Skill Wheel Data (Page 9 of Specification)
  const skillWheelData = [
    { subject: 'Fluency', score: 78, benchmark: 70, fullMark: 100, category: 'Speaking' },
    { subject: 'Clarity', score: 82, benchmark: 75, fullMark: 100, category: 'Speaking' },
    { subject: 'Vocabulary', score: 74, benchmark: 65, fullMark: 100, category: 'Language' },
    { subject: 'Grammar', score: 71, benchmark: 70, fullMark: 100, category: 'Language' },
    { subject: 'Pronunciation', score: 80, benchmark: 70, fullMark: 100, category: 'Speaking' },
    { subject: 'Confidence', score: 83, benchmark: 75, fullMark: 100, category: 'Presentation' },
    { subject: 'Critical Thinking', score: 76, benchmark: 65, fullMark: 100, category: 'Thinking' },
    { subject: 'Listening', score: 69, benchmark: 70, fullMark: 100, category: 'Interaction' },
    { subject: 'Leadership', score: 72, benchmark: 60, fullMark: 100, category: 'Interaction' },
  ];

  // Month-over-Month Progress Timeline Data (Page 9 of Specification: 58 -> 78, +20 points)
  const progressTimelineData = [
    { month: 'Month 1', score: 58, benchmark: 60, change: 'Baseline', topic: 'Renewable Energy vs Nuclear Power' },
    { month: 'Month 2', score: 64, benchmark: 63, change: '+6 pts', topic: 'Cryptocurrency & Financial Regulation' },
    { month: 'Month 3', score: 71, benchmark: 67, change: '+7 pts', topic: 'Work From Home vs Office Culture' },
    { month: 'Month 4', score: 78, benchmark: 70, change: '+7 pts', topic: 'AI Ethics in Autonomous Systems' },
  ];

  // Historical "MY GD JOURNEY" Table Data (Page 10 of Specification)
  const historySessions = [
    {
      id: 'GD-SES-004',
      date: '28 Oct 2024',
      topic: 'AI Ethics in Autonomous Systems & Robotics',
      duration: '20 Mins',
      score: 78,
      percentile: '88th',
      grade: 'Very Good',
      status: 'Completed',
      delta: '+7 pts',
      feedback: 'Highly articulate opening, referenced factual safety frameworks, balanced turn allocation.',
      facultyEvaluator: 'Dr. Sunita Rao',
    },
    {
      id: 'GD-SES-003',
      date: '14 Oct 2024',
      topic: 'Work From Home vs Office Culture in IT Industry',
      duration: '20 Mins',
      score: 71,
      percentile: '80th',
      grade: 'Good',
      status: 'Completed',
      delta: '+7 pts',
      feedback: 'Strong counter-argument synthesis, maintained conversational poise, reduced filler hesitations.',
      facultyEvaluator: 'Prof. Ananya Sen',
    },
    {
      id: 'GD-SES-002',
      date: '29 Sep 2024',
      topic: 'Cryptocurrency & Global Financial Regulations',
      duration: '15 Mins',
      score: 64,
      percentile: '72nd',
      grade: 'Good',
      status: 'Completed',
      delta: '+6 pts',
      feedback: 'Constructive participation, could offer more real-world banking statistics.',
      facultyEvaluator: 'Dr. Sunita Rao',
    },
    {
      id: 'GD-SES-001',
      date: '15 Sep 2024',
      topic: 'Renewable Energy Transitions vs Nuclear Power',
      duration: '15 Mins',
      score: 58,
      percentile: '60th',
      grade: 'Average',
      status: 'Completed',
      delta: 'Baseline',
      feedback: 'Needs improvement in conversational flow and reducing vocal hesitations (uh/um).',
      facultyEvaluator: 'Prof. Rajesh K',
    },
  ];

  const handleDownload = (type: StudentReportType) => {
    downloadStudentReport(type, studentId, studentName);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToSessionReport}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
            title="Back to Session Evaluation"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Tier-4 Candidate Intelligence
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                ● Placement Verified
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-0.5">
              My GD Journey &amp; Personal Development Profile
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Profile</span>
          </button>

          <button
            onClick={() => handleDownload('placement_readiness_cert')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Placement Readiness Certificate</span>
          </button>
        </div>
      </div>

      {/* 1. Personal Development Profile Hero (Page 9 of Specification) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/60 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-300 border border-white/10 backdrop-blur-md">
                🎓 Candidate: {studentName} ({studentId})
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                88th Institutional Percentile
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-black tracking-tight text-white">
              Placement GD Readiness: <span className="text-emerald-400">Proficient (Tier-1 Ready)</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Synthesized performance across 4 completed autonomous group discussions at {collegeName}. 
              Demonstrated consistent structural mastery, vocabulary expansion, and assertiveness under cross-questioning.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-300 pt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>4 Practice Sessions</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>28.4 Total Speaking Mins</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Infractions</span>
              </span>
            </div>
          </div>

          {/* Overall GD Score Card 78/100 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-6 rounded-3xl text-center flex flex-col items-center justify-center shrink-0 min-w-[220px]">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-indigo-200">
              Overall GD Score
            </span>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-5xl sm:text-6xl font-heading font-black text-white tracking-tight font-mono">
                78
              </span>
              <span className="text-lg text-slate-400 font-mono">/ 100</span>
            </div>
            
            <div className="mt-2.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold">
              Placement Grade: Very Good
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-slate-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>+20 Points</strong> vs Baseline</span>
            </div>
          </div>
        </div>

        {/* Ambient background decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Visualizations Grid: 9-Dimension Skill Wheel & Month-over-Month Growth Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 9-Dimension Skill Wheel (Radar Chart) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>9-Dimension Skill Wheel &amp; Competency Radar</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluation across Fluency, Clarity, Vocabulary, Grammar, Pronunciation, Confidence, Critical Thinking, Listening, Leadership.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillWheelData} outerRadius="75%">
                <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                <Radar name="My Competency" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Radar name="Placement Benchmark" dataKey="benchmark" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{data.subject} ({data.category})</p>
                          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Your Score: {data.score}/100</p>
                          <p className="text-emerald-600 dark:text-emerald-400">Benchmark: {data.benchmark}/100</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Your Current Mastery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Industry Placement Threshold</span>
            </div>
          </div>
        </div>

        {/* Month-over-Month Progress Timeline (Page 9: 58 -> 78, +20 points) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Month-over-Month Progress Timeline</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Longitudinal progression across sequential mock and evaluated GD rounds.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              +20 Pts Gain
            </span>
          </div>

          {/* Highlight Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Continuous Upward Trajectory (+34.5% Relative Improvement)
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  From baseline 58 (Month 1) to placement-ready 78 (Month 4).
                </span>
              </div>
            </div>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressTimelineData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[40, 90]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{data.month}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">Score: {data.score}/100 ({data.change})</p>
                          <p className="text-slate-500 text-[10px]">{data.topic}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#progressGrad)" />
                <Line type="monotone" dataKey="benchmark" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. 4-Category Speaking Analytics (4-Quadrant Grid, Page 10 of Specification) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>4-Tier Speaking &amp; Cognitive Analytics</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Granular breakdown covering vocal delivery, language accuracy, conceptual argumentation, and interactive team behaviors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Speaking Metrics */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Volume2 className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Speaking Delivery</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Pacing (WPM)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">135 WPM</span>
                </div>
                <span className="text-[10px] text-slate-400">Optimal (Target: 120-150)</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Filler Frequency</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">3 / min</span>
                </div>
                <span className="text-[10px] text-slate-400">Low (92% cleaner delivery)</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Total Speaking Time</span>
                  <span className="font-mono font-bold">28.4 Mins</span>
                </div>
                <span className="text-[10px] text-slate-400">Across 4 discussion rounds</span>
              </div>
            </div>
          </div>

          {/* 2. Language Metrics */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Language &amp; Grammar</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Grammar Accuracy</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">84%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '84%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Vocabulary Richness</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">74%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Sentence Complexity</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">79%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '79%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Thinking Metrics */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Brain className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Cognitive Reasoning</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Logical Coherence</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">82%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Argument Structure</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">79%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: '79%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Counter-Argument Defense</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">74%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Interaction Metrics */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <Users className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Team Interaction</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Active Listening</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">75%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Turn-Taking Balance</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">80%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Interruptions Avoided</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">88%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Historical "MY GD JOURNEY" Record / Log Table (Page 10 of Specification) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Historical "MY GD JOURNEY" Discussion Log</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chronological ledger of all discussions attended, evaluations achieved, and feedback milestones.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-center">
            {historySessions.length} Attended Sessions
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Discussion Topic</th>
                <th className="py-3 px-3.5">Duration</th>
                <th className="py-3 px-3.5">Score (100)</th>
                <th className="py-3 px-3.5">Progress Delta</th>
                <th className="py-3 px-3.5">Faculty In-Charge</th>
                <th className="py-3 px-3.5">Key AI Improvement Insight</th>
                <th className="py-3 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {historySessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-3.5 font-mono text-slate-600 dark:text-slate-400 font-medium">
                    {s.date}
                  </td>
                  <td className="py-3.5 px-3.5 font-bold text-slate-900 dark:text-white">
                    <span className="hover:text-indigo-600 transition-colors cursor-pointer" title={s.topic}>
                      {s.topic}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400 font-normal">{s.id}</span>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-slate-600 dark:text-slate-400">
                    {s.duration}
                  </td>
                  <td className="py-3.5 px-3.5 font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {s.score}
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      s.delta === 'Baseline'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {s.delta}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-700 dark:text-slate-300">
                    {s.facultyEvaluator}
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={s.feedback}>
                    {s.feedback}
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{s.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Downloadable Student Management Reports (Specification Page 10) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Official Student Artifacts
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Downloadable Student Performance &amp; Placement Reports</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export verified CSV records for placement cells, personal study plans, and career portfolio dossiers.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-center">
            5 Instant Exports
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          {/* Report 1 */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Performance Profile</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Overall score (78/100), percentile, speaking minutes, and placement readiness badge.
              </p>
            </div>
            <button
              onClick={() => handleDownload('student_performance_profile')}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Report 2 */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">GD History Log</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Chronological ledger of all discussions attended with timestamps and score deltas.
              </p>
            </div>
            <button
              onClick={() => handleDownload('student_history_log')}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Report 3 */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Skill Wheel Audit</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                9-dimension skill metrics compared against industry placement thresholds.
              </p>
            </div>
            <button
              onClick={() => handleDownload('skill_radar_report')}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Report 4 */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Month-over-Month Audit</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Longitudinal progression documenting +20 points gain from Month 1 to Month 4.
              </p>
            </div>
            <button
              onClick={() => handleDownload('month_over_month_report')}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Report 5 */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
            <div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Readiness Certificate</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Official institutional verification document for corporate placement eligibility.
              </p>
            </div>
            <button
              onClick={() => handleDownload('placement_readiness_cert')}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
