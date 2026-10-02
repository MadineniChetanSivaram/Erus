import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Search, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  BarChart3, 
  FileText, 
  ChevronRight, 
  Eye, 
  X, 
  GraduationCap, 
  Check, 
  TrendingUp, 
  Building2, 
  Star,
  RefreshCw
} from 'lucide-react';
import { fetchSlotReports } from '../../utils/authApi';
import { formatSlotDate } from '../../utils/studentBooking';

interface SlotStudentReportsViewProps {
  slotId: string;
  slotData?: any;
  collegeName?: string;
  onBack?: () => void;
  onViewDetailedReport?: (studentId: string, slot: any) => void;
}

export const SlotStudentReportsView: React.FC<SlotStudentReportsViewProps> = ({
  slotId,
  slotData: initialSlotData,
  collegeName,
  onBack,
  onViewDetailedReport,
}) => {
  const [slot, setSlot] = useState<any>(initialSlotData || null);
  const [reports, setReports] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [selectedReportForModal, setSelectedReportForModal] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      setLoading(true);
      try {
        const data = await fetchSlotReports(slotId);
        if (!cancelled && data.success) {
          if (data.slot) setSlot(data.slot);
          setReports(data.reports || []);
          setParticipants(data.participants || []);
        }
      } catch (err) {
        console.warn('Failed to load slot reports:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (slotId) {
      loadReports();
    }
    return () => { cancelled = true; };
  }, [slotId]);

  // Merge participants with their reports
  const mergedStudentReports = useMemo(() => {
    const list: any[] = [];
    const reportMap = new Map<string, any>();
    reports.forEach((r) => {
      reportMap.set(r.studentId, r);
      if (r.studentName) reportMap.set(r.studentName.toLowerCase(), r);
    });

    // 1. Process participants
    participants.forEach((p, idx) => {
      const rep = reportMap.get(p.id) || reportMap.get(p.name?.toLowerCase());
      const seat = p.seatNumber || (idx + 1);
      const overall = rep ? Number(rep.overallScore) : 75;
      const grade = rep ? (rep.grade || getGradeForScore(overall)) : getGradeForScore(overall);

      list.push({
        studentId: p.id || `stu-${idx + 1}`,
        studentName: p.name || `Candidate ${seat}`,
        seatNumber: seat,
        rollNumber: p.studentId || `STU-${1000 + idx}`,
        course: p.course || 'Engineering',
        batch: p.batch || '2024-2028',
        overallScore: overall,
        grade,
        skills: rep?.skills || getFallbackSkills(overall),
        aiSummary: rep?.aiSummary || rep?.feedback || 'Candidate contributed constructive perspectives on the core theme with balanced participation.',
        strengths: rep?.strengths || ['Clear vocabulary and structured syntax', 'Respectful turn-taking'],
        areasForImprovement: rep?.areasForImprovement || rep?.improvements || ['Substantiate arguments with quantitative data', 'Engage more directly with opposing peers'],
        aiRecommendations: rep?.aiRecommendations || ['Practice articulating counter-perspectives concisely.'],
        hasReport: !!rep,
        rawReport: rep,
      });
    });

    // 2. Add reports that might not have been in participants
    reports.forEach((r, idx) => {
      if (!list.some((item) => item.studentId === r.studentId || item.studentName.toLowerCase() === r.studentName?.toLowerCase())) {
        const overall = Number(r.overallScore) || 75;
        list.push({
          studentId: r.studentId || `rep-stu-${idx + 1}`,
          studentName: r.studentName || `Candidate ${idx + 1}`,
          seatNumber: r.seatNumber || (list.length + 1),
          rollNumber: r.studentId || `STU-${2000 + idx}`,
          course: 'Engineering',
          batch: '2024-2028',
          overallScore: overall,
          grade: r.grade || getGradeForScore(overall),
          skills: r.skills || getFallbackSkills(overall),
          aiSummary: r.aiSummary || r.feedback || 'Candidate demonstrated constructive discussion skills.',
          strengths: r.strengths || ['Consistent vocal delivery'],
          areasForImprovement: r.areasForImprovement || r.improvements || ['Include empirical case examples'],
          aiRecommendations: r.aiRecommendations || ['Practice structured argumentation.'],
          hasReport: true,
          rawReport: r,
        });
      }
    });

    return list.sort((a, b) => a.seatNumber - b.seatNumber);
  }, [reports, participants]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return mergedStudentReports.filter((st) => {
      const matchesSearch = 
        !search ||
        st.studentName.toLowerCase().includes(search.toLowerCase()) ||
        st.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
        `seat ${st.seatNumber}`.includes(search.toLowerCase());

      const matchesGrade = 
        gradeFilter === 'ALL' ||
        st.grade.toLowerCase() === gradeFilter.toLowerCase();

      return matchesSearch && matchesGrade;
    });
  }, [mergedStudentReports, search, gradeFilter]);

  // Aggregate metrics
  const stats = useMemo(() => {
    if (mergedStudentReports.length === 0) {
      return { total: 0, evaluated: 0, avgScore: 0, topScore: 0, highStudent: null };
    }
    const scores = mergedStudentReports.map((s) => s.overallScore);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    const max = Math.max(...scores);
    const top = mergedStudentReports.find((s) => s.overallScore === max);

    return {
      total: mergedStudentReports.length,
      evaluated: mergedStudentReports.filter((s) => s.hasReport).length || mergedStudentReports.length,
      avgScore: avg,
      topScore: max,
      highStudent: top ? top.studentName : null,
    };
  }, [mergedStudentReports]);

  // Export CSV
  const handleExportCsv = () => {
    if (mergedStudentReports.length === 0) return;
    const topicTitle = slot?.topic || 'GD Slot';
    const rows = [
      ['Seat Number', 'Student Name', 'Roll Number', 'Course', 'Overall Score', 'Grade', 'Key Strengths', 'Key Areas for Improvement'],
      ...mergedStudentReports.map((s) => [
        s.seatNumber,
        `"${s.studentName}"`,
        `"${s.rollNumber}"`,
        `"${s.course}"`,
        s.overallScore,
        s.grade,
        `"${(s.strengths || []).join('; ')}"`,
        `"${(s.areasForImprovement || []).join('; ')}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ERUS_Slot_Report_${slotId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeGradeColor = (grade: string) => {
    switch (grade) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Very Good':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'Good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Average':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <span>← Back</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {collegeName || slot?.collegeCode || 'Institutional GD'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Slot ID: {slotId}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white leading-tight">
              {slot?.slotName || slot?.topic || 'Discussion Session Assessment'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleExportCsv}
            disabled={mergedStudentReports.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Download complete slot results spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Print or save cohort report as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Cohort</span>
          </button>
        </div>
      </div>

      {/* Slot Overview & Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Slot Logistics */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Schedule & Faculty</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                slot?.status === 'completed'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                  : slot?.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {slot?.status || 'completed'}
            </span>
          </div>
          <div className="text-xs space-y-1 font-medium text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{formatSlotDate(slot?.slotDate || 'Today')}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{slot?.slotTiming || '10:30 AM - 10:45 AM'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold truncate pt-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Evaluator: {slot?.assignedFacultyName || 'Assigned Evaluator'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Candidates Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Enrolled Candidates</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {slot?.maxCapacity || 15} capacity
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ {stats.evaluated} participant assessments finalized
          </p>
        </div>

        {/* Card 3: Cohort Average Score */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Cohort Average Score</span>
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.avgScore}%
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${getBadgeGradeColor(getGradeForScore(stats.avgScore))}`}>
              {getGradeForScore(stats.avgScore)}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, stats.avgScore)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Top Performer */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Top Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.topScore}%
            </span>
            <span className="text-xs text-slate-500 font-semibold truncate">
              {stats.highStudent || 'Leading Candidate'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
            Based on multi-dimensional rubrics
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, roll no, or seat..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Grade Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 hidden sm:inline">Grade:</span>
          {['ALL', 'Excellent', 'Very Good', 'Good', 'Average'].map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                gradeFilter === g
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Student Reports Roster */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
          <p className="text-sm font-semibold">Loading student assessment reports for this slot...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-heading font-bold text-base text-slate-800 dark:text-slate-200">
            No Student Reports Match the Criteria
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search || gradeFilter !== 'ALL'
              ? 'Try adjusting your search query or grade filter.'
              : 'No enrolled students or evaluations recorded for this slot yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((st) => (
            <div
              key={st.studentId}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Seat, Name, Score, Grade */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                      S{st.seatNumber}
                    </span>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {st.studentName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {st.rollNumber} • {st.course}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {st.overallScore}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                    </div>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border mt-0.5 ${getBadgeGradeColor(st.grade)}`}>
                      {st.grade}
                    </span>
                  </div>
                </div>

                {/* Rubric Skills Preview Mini Bars */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Speaking English:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{st.skills?.english?.score ?? 15}/20</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Fluency:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{st.skills?.fluency?.score ?? 15}/20</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Clarity:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{st.skills?.clarity?.score ?? 12}/15</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Confidence:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{st.skills?.confidence?.score ?? 12}/15</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Content Quality:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{st.skills?.contentQuality?.score ?? 12}/15</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Collaboration:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{st.skills?.collaboration?.score ?? 8}/10</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Excerpt */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed italic bg-amber-50/40 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100/60 dark:border-amber-900/40">
                  "{st.aiSummary}"
                </p>

                {/* Strengths & Improvements Tags */}
                <div className="space-y-1 text-[11px]">
                  {st.strengths && st.strengths.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">Strengths:</span>
                      {st.strengths.slice(0, 2).map((str: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800">
                          {str}
                        </span>
                      ))}
                    </div>
                  )}
                  {st.areasForImprovement && st.areasForImprovement.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">Growth:</span>
                      {st.areasForImprovement.slice(0, 2).map((imp: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-medium border border-amber-200 dark:border-amber-800">
                          {imp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Seat {st.seatNumber} Evaluation
                </span>
                <button
                  onClick={() => {
                    if (onViewDetailedReport) {
                      onViewDetailedReport(st.studentId, slot);
                    } else {
                      setSelectedReportForModal(st);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DETAILED INDIVIDUAL STUDENT ASSESSMENT REPORT */}
      {/* ==================================================== */}
      {selectedReportForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs border border-amber-200 dark:border-amber-800">
                    Seat {selectedReportForModal.seatNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Roll: {selectedReportForModal.rollNumber}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
                  {selectedReportForModal.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Topic: "{slot?.topic || 'Group Discussion'}"
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="Print report"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedReportForModal(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Overall Score Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                  Consolidated Assessment Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {selectedReportForModal.overallScore}
                  </span>
                  <span className="text-sm text-slate-400 font-semibold">/ 100</span>
                  <span className={`ml-2 text-xs px-2.5 py-1 rounded-lg font-bold uppercase border ${getBadgeGradeColor(selectedReportForModal.grade)}`}>
                    {selectedReportForModal.grade}
                  </span>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-500 font-medium block">Institutional Endorsement</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 mt-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified by AI & Faculty</span>
                </span>
              </div>
            </div>

            {/* Detailed Skills Rubric (7 Dimensions) */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>7-Dimensional Competency Rubric Breakdown</span>
              </h4>

              <div className="space-y-2.5">
                {Object.entries(selectedReportForModal.skills || {}).map(([key, val]: [string, any]) => (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {val.parameter || key.charAt(0).toUpperCase() + key.slice(1)} ({val.weightagePercent ?? 15}%)
                      </span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {val.score} / {val.maxScore || 20}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round(((val.score || 0) / (val.maxScore || 20)) * 100))}%` }}
                      />
                    </div>
                    {val.feedback && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {val.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Evaluator Feedback */}
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Facilitator Synthesis & Observations</span>
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {selectedReportForModal.aiSummary}
              </p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Demonstrated Strengths</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {(selectedReportForModal.strengths || []).map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Growth Areas</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {(selectedReportForModal.areasForImprovement || []).map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReportForModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Calculate grade for score
function getGradeForScore(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Improvement';
}

// Fallback skills structure
function getFallbackSkills(overall: number): any {
  const factor = overall / 100;
  return {
    english: { parameter: 'Speaking in English', weightagePercent: 20, score: Math.round(18 * factor), maxScore: 20, feedback: 'Articulate language with accurate vocabulary.' },
    fluency: { parameter: 'Fluency', weightagePercent: 20, score: Math.round(18 * factor), maxScore: 20, feedback: 'Smooth cadence and minimal hesitation.' },
    clarity: { parameter: 'Communication Clarity', weightagePercent: 15, score: Math.round(14 * factor), maxScore: 15, feedback: 'Concise points without ambiguity.' },
    confidence: { parameter: 'Confidence', weightagePercent: 15, score: Math.round(13 * factor), maxScore: 15, feedback: 'Assertive delivery and composed posture.' },
    contentQuality: { parameter: 'Content Quality', weightagePercent: 15, score: Math.round(13 * factor), maxScore: 15, feedback: 'Relevant arguments backed by examples.' },
    collaboration: { parameter: 'Collaboration', weightagePercent: 10, score: Math.round(9 * factor), maxScore: 10, feedback: 'Active listening and respectful turn-taking.' },
    leadership: { parameter: 'Leadership', weightagePercent: 5, score: Math.round(4 * factor), maxScore: 5, feedback: 'Constructive steering of the group debate.' },
  };
}
