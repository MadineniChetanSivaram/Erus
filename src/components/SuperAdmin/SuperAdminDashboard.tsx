import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crown, 
  Building2, 
  Users, 
  GraduationCap, 
  Calendar, 
  Plus, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Search,
  ExternalLink,
  KeyRound,
  Eye,
  Trash2,
  AlertTriangle,
  Activity,
  Server,
  RefreshCw,
  Sliders,
  Gauge,
  BarChart3,
  FileText,
  Filter
} from 'lucide-react';
import { SuperAdminUser, CollegeInfo } from '../../types/auth';
import { 
  fetchAdminColleges, 
  registerNewCollege, 
  sendCollegeCredentials, 
  deleteCollege,
  fetchAdminStats,
  fetchServerCapacity,
  updateServerCapacity,
  fetchCollegeSlots,
  ServerCapacityData
} from '../../utils/authApi';
import { SlotStudentReportsView } from '../AssessmentReport/SlotStudentReportsView';

interface SuperAdminDashboardProps {
  currentUser: SuperAdminUser;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
}) => {
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [stats, setStats] = useState({
    totalColleges: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalSlots: 0,
    activeLiveGDs: 0,
    activeUsersCount: 0,
    activeUsersTodayCount: 0,
  });
  const [capacityData, setCapacityData] = useState<ServerCapacityData | null>(null);
  const [editingLimit, setEditingLimit] = useState<number>(100);
  const [editingEnforce, setEditingEnforce] = useState<boolean>(true);
  const [isSavingCapacity, setIsSavingCapacity] = useState<boolean>(false);
  const [capacitySuccessMsg, setCapacitySuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<any | null>(null);
  const [collegeToDelete, setCollegeToDelete] = useState<CollegeInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Navigation tab: Institutions Directory vs Student Reports
  const [mainTab, setMainTab] = useState<'institutions' | 'reports'>('institutions');

  // Slot-wise Student Reports State (College -> Topic -> Slot)
  const [selectedCollegeCode, setSelectedCollegeCode] = useState<string>('');
  const [collegeSlots, setCollegeSlots] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  const [newCollege, setNewCollege] = useState({
    name: '',
    code: '',
    contactEmail: '',
    phone: '',
    address: '',
    adminName: '',
    adminPassword: '',
  });

  const handleCollegeChange = async (collegeCode: string) => {
    setSelectedCollegeCode(collegeCode);
    setLoadingSlots(true);
    try {
      const slots = await fetchCollegeSlots(collegeCode);
      setCollegeSlots(slots || []);
      const topics = Array.from(new Set((slots || []).map((s: any) => s.topic || s.slotName))).filter(Boolean) as string[];
      const firstTopic = topics[0] || '';
      setSelectedTopic(firstTopic);
      const matchingSlots = (slots || []).filter((s: any) => (s.topic || s.slotName) === firstTopic);
      setSelectedSlotId(matchingSlots[0]?.id || '');
    } catch (err) {
      console.warn('Error loading slots for college:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    const matchingSlots = collegeSlots.filter((s: any) => (s.topic || s.slotName) === topic);
    setSelectedSlotId(matchingSlots[0]?.id || '');
  };

  const distinctTopics = useMemo(() => {
    return Array.from(new Set(collegeSlots.map((s: any) => s.topic || s.slotName))).filter(Boolean) as string[];
  }, [collegeSlots]);

  const topicSlots = useMemo(() => {
    if (!selectedTopic) return collegeSlots;
    return collegeSlots.filter((s: any) => (s.topic || s.slotName) === selectedTopic);
  }, [collegeSlots, selectedTopic]);

  const currentSelectedSlot = useMemo(() => {
    return collegeSlots.find((s: any) => s.id === selectedSlotId) || topicSlots[0] || null;
  }, [collegeSlots, selectedSlotId, topicSlots]);

  const currentCollege = useMemo(() => {
    return colleges.find((c) => c.code === selectedCollegeCode) || null;
  }, [colleges, selectedCollegeCode]);

  useEffect(() => {
    loadData();

    // Auto-refresh live active user counts and server capacity stats every 15 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [colData, statsData, capData] = await Promise.all([
        fetchAdminColleges(),
        fetchAdminStats(),
        fetchServerCapacity(),
      ]);
      if (colData && colData.length > 0) {
        setColleges(colData);
        if (!selectedCollegeCode) {
          handleCollegeChange(colData[0].code);
        }
      }
      if (statsData) setStats(statsData);
      if (capData) {
        setCapacityData(capData);
        setEditingLimit(capData.dailyUserLimit);
        setEditingEnforce(capData.enforceDailyLimit);
      }
    } catch (e) {
      console.warn('Super Admin load error:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSaveCapacity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingCapacity(true);
    setCapacitySuccessMsg(null);
    try {
      const res = await updateServerCapacity({
        dailyUserLimit: Math.max(0, Number(editingLimit) || 0),
        enforceDailyLimit: Boolean(editingEnforce),
        maxConcurrentUsers: capacityData?.maxConcurrentUsers || 50,
      });
      if (res.success && res.capacity) {
        setCapacityData(res.capacity);
        setEditingLimit(res.capacity.dailyUserLimit);
        setEditingEnforce(res.capacity.enforceDailyLimit);
        setCapacitySuccessMsg(res.message || 'Server capacity and daily active user limits updated successfully!');
        setTimeout(() => setCapacitySuccessMsg(null), 5000);
      } else {
        alert(res.message || 'Failed to update capacity settings');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating server capacity settings');
    } finally {
      setIsSavingCapacity(false);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollege.name || !newCollege.code || !newCollege.contactEmail) return;

    setLoading(true);
    const res = await registerNewCollege(newCollege);
    setLoading(false);

    if (res && res.success) {
      setIsOnboardOpen(false);
      setCredentialsModal(res.generatedCredentials);
      setBannerMsg(`Institution "${newCollege.name}" onboarded. Credentials generated below.`);
      
      if (res.college) {
        setColleges((prev) => [res.college, ...prev.filter((c) => c.code?.toUpperCase() !== res.college.code?.toUpperCase())]);
        setStats((prev) => ({ ...prev, totalColleges: (prev.totalColleges || 0) + 1 }));
      }

      setNewCollege({
        name: '',
        code: '',
        contactEmail: '',
        phone: '',
        address: '',
        adminName: '',
        adminPassword: '',
      });
      loadData();
    }
  };

  const handleSendCredentials = async (collegeId: string, email: string) => {
    const res = await sendCollegeCredentials(collegeId);
    if (res && res.success) {
      setBannerMsg(`Official onboarding credentials sent to ${email}.`);
    }
  };

  const handleConfirmDeleteCollege = async () => {
    if (!collegeToDelete) return;
    setIsDeleting(true);
    const target = collegeToDelete.id || collegeToDelete.code;
    const res = await deleteCollege(target, collegeToDelete.code, collegeToDelete.name);
    setIsDeleting(false);

    if (res && res.success) {
      setBannerMsg(`Institution "${collegeToDelete.name}" (${collegeToDelete.code}) and all its student and faculty records have been deleted successfully.`);
      setColleges((prev) =>
        prev.filter((c) => c.id !== collegeToDelete.id && c.code?.toUpperCase() !== collegeToDelete.code?.toUpperCase())
      );
      setStats((prev) => ({
        ...prev,
        totalColleges: Math.max(0, (prev.totalColleges || 1) - 1),
        totalStudents: Math.max(0, (prev.totalStudents || 0) - (collegeToDelete.studentCount || 0)),
        totalFaculty: Math.max(0, (prev.totalFaculty || 0) - (collegeToDelete.facultyCount || 0)),
      }));
      setCollegeToDelete(null);
      loadData();
    } else {
      setBannerMsg(res?.error || 'Failed to delete college.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredColleges = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pt-2">
      
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-900/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none transform translate-x-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20 shadow-inner shrink-0">
              <Crown className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/40 text-purple-200 font-mono font-bold tracking-wider">
                  ROOT / GLOBAL
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold">
                  SUPER ADMIN
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
                ERUS Global Platform Management
              </h1>
              <p className="text-purple-200/90 text-xs sm:text-sm mt-0.5 font-medium">
                Onboard partner universities, manage college admins, and provision institutional access
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white text-purple-950 hover:bg-purple-50 font-bold text-xs sm:text-sm shadow-lg shadow-black/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-purple-700" />
            <span>Onboard New Institution</span>
          </button>
        </div>
      </div>

      {/* Banner / Success Toast */}
      {bannerMsg && (
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs sm:text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-purple-600 hover:text-purple-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Super Admin Main View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setMainTab('institutions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
            mainTab === 'institutions'
              ? 'bg-purple-600 text-white shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Institutions & Capacity</span>
        </button>

        <button
          onClick={() => setMainTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
            mainTab === 'reports'
              ? 'bg-purple-600 text-white shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Student Assessment Reports (Slot-Wise)</span>
        </button>
      </div>

      {mainTab === 'institutions' ? (
        <>
      {/* Top 5 Global Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Institutions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {colleges.length || stats.totalColleges}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Partner Colleges
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {stats.totalStudents}
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Registered Students
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
            {stats.totalFaculty}
          </div>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Active Observers
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">College Admins</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {colleges.length || stats.totalColleges}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
            <span>●</span> Institutional Admins
          </span>
        </div>

        {/* 5th Card: Active Users Online (Live) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Users (Live)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center relative">
              <Activity className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2">
            <span>{capacityData?.activeUsersCount ?? stats.activeUsersCount ?? 0}</span>
            <span className="text-xs font-semibold text-slate-400">online</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between mt-1">
            <span>Today: <strong className="text-slate-800 dark:text-slate-200">{capacityData?.activeUsersTodayCount ?? stats.activeUsersTodayCount ?? 0}</strong> unique</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {capacityData?.serverLoadPercent ?? 0}% Load
            </span>
          </div>
        </div>
      </div>

      {/* Server Load & Daily Active User Limit Control Center */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs border border-indigo-100 dark:border-indigo-900/50">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                  Server Load & Daily Active User Restriction
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync (15s)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor real-time concurrent system load and configure daily active user thresholds to prevent server degradation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(false)}
            className="self-start md:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh active users and server metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {capacitySuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{capacitySuccessMsg}</span>
          </div>
        )}

        {/* Load Status & Capacity Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Server Load Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-indigo-500" />
                Live Server Load
              </span>
              <span className={`font-bold font-mono text-sm ${
                (capacityData?.serverLoadPercent ?? 0) > 85 ? 'text-rose-600' :
                (capacityData?.serverLoadPercent ?? 0) > 60 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {capacityData?.serverLoadPercent ?? 0}%
              </span>
            </div>
            {/* Progress track */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (capacityData?.serverLoadPercent ?? 0) > 85
                    ? 'bg-rose-500'
                    : (capacityData?.serverLoadPercent ?? 0) > 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, capacityData?.serverLoadPercent ?? 0))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {(capacityData?.serverLoadPercent ?? 0) > 85 ? 'High system strain detected — throttling recommended.' :
               (capacityData?.serverLoadPercent ?? 0) > 60 ? 'Moderate load — normal operations.' :
               'Nominal performance — server latency optimal.'}
            </p>
          </div>

          {/* Active Users Online Right Now */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                Live Active Users
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Online Now
              </span>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-1">
              {capacityData?.activeUsersCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Heartbeats transmitted in the last 20 minutes across student and faculty sessions.
            </p>
          </div>

          {/* Daily Quota Utilization */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-500" />
                Daily Logins Today
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                capacityData?.enforceDailyLimit
                  ? (capacityData.dailyUserLimit > 0 && capacityData.activeUsersTodayCount >= capacityData.dailyUserLimit)
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    : 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {capacityData?.enforceDailyLimit ? 'Enforcement Active' : 'Enforcement Off'}
              </span>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-1">
              {capacityData?.activeUsersTodayCount ?? 0}{' '}
              <span className="text-sm font-semibold text-slate-400">
                / {capacityData?.dailyUserLimit && capacityData.dailyUserLimit > 0 ? `${capacityData.dailyUserLimit} limit` : 'No Cap'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {capacityData?.enforceDailyLimit && capacityData.dailyUserLimit > 0 && (capacityData.activeUsersTodayCount >= capacityData.dailyUserLimit)
                ? '⚠️ Daily cap is reached! New student/faculty logins are paused until 00:00 UTC rollover.'
                : 'Resets daily at 00:00 UTC. Super Admin always retains unrestricted bypass access.'}
            </p>
          </div>
        </div>

        {/* Configuration Controls */}
        <form onSubmit={handleSaveCapacity} className="bg-purple-50/50 dark:bg-purple-950/20 p-4 sm:p-5 rounded-2xl border border-purple-100 dark:border-purple-900/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                  Configure Active User Quota For The Day
                </h3>
              </div>

              {/* Input & Quick Presets */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="dailyLimitInput" className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Max Daily Users:
                  </label>
                  <input
                    id="dailyLimitInput"
                    type="number"
                    min="0"
                    max="10000"
                    value={editingLimit}
                    onChange={(e) => setEditingLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">(0 = unlimited)</span>
                </div>

                {/* Preset Shortcut Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400 mr-1">Presets:</span>
                  {[25, 50, 100, 250, 500, 0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditingLimit(val)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        editingLimit === val
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      }`}
                    >
                      {val === 0 ? 'No Cap' : `${val}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enforcement Toggle Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="enforceLimitToggle"
                  type="checkbox"
                  checked={editingEnforce}
                  onChange={(e) => setEditingEnforce(e.target.checked)}
                  className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="enforceLimitToggle" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <span className="font-semibold text-slate-900 dark:text-white">Strictly enforce daily cap</span> — Reject new student and faculty logins with HTTP 429 when quota is reached. <span className="text-slate-500 dark:text-slate-400">(Super Admins can always sign in regardless of load)</span>.
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSavingCapacity}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSavingCapacity ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Server Restriction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Active Users Presence Feed (if any users are active) */}
        {capacityData?.activeUsers && capacityData.activeUsers.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Active Sessions ({capacityData.activeUsers.length})
              </span>
              <span className="text-[11px] text-slate-400">Prunes automatically after 20m of idle inactivity</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {capacityData.activeUsers.map((u) => {
                const minutesAgo = Math.max(0, Math.floor((Date.now() - u.lastActive) / 60000));
                return (
                  <div key={u.userId} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {u.email} {u.college ? `• ${u.college}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        u.role === 'super_admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        u.role === 'faculty' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                        u.role === 'college_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {minutesAgo === 0 ? 'Active now' : `${minutesAgo}m ago`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Colleges Management Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
              Registered Colleges & Institutions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each institution has a designated College Admin who manages faculty, student rosters, and institutional operations.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by college name, code, or admin email..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Institutions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-5">College Code</th>
                <th className="py-3.5 px-5">Institution Name</th>
                <th className="py-3.5 px-5">College Admin Email</th>
                <th className="py-3.5 px-5 text-center">Students</th>
                <th className="py-3.5 px-5 text-center">Faculty</th>
                <th className="py-3.5 px-5 text-right">Credentials & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredColleges.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono font-bold">
                      {c.code}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</div>
                    <div className="text-[11px] text-slate-400">{c.address || 'Academic Campus'}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">{c.adminEmail}</div>
                    <div className="text-[11px] text-slate-400">{c.adminName}</div>
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {c.studentCount || 0}
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {c.facultyCount || 0}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          handleCollegeChange(c.code);
                          setMainTab('reports');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        title="View Student Assessment Reports for this institution"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Reports</span>
                      </button>

                      <button
                        onClick={() =>
                          setCredentialsModal({
                            email: c.adminEmail || c.contactEmail,
                            password: c.adminPassword || `Erus@${c.code}2026`,
                            role: 'college_admin',
                            collegeName: c.name,
                            collegeCode: c.code,
                            adminId: `CADM-${c.code}-001`,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="View Login Credentials"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                        <span>View Pass</span>
                      </button>

                      <button
                        onClick={() => handleSendCredentials(c.id, c.adminEmail || c.contactEmail)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Dispatch credentials email"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Mail</span>
                      </button>

                      <button
                        onClick={() => setCollegeToDelete(c)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete Institution"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Step 1, 2, 3 Selector Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Slot-Wise Student Assessment Explorer</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select an Institution, then a Discussion Topic, and choose a Slot to inspect student assessment reports and cohort analytics.
                </p>
              </div>

              {loadingSlots && (
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading slots...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Select College */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Select Institution</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedCollegeCode}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer shadow-xs"
                  >
                    <option value="" disabled>-- Choose an Institution --</option>
                    {colleges.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Select Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Select Discussion Topic</span>
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedTopic}
                    disabled={!selectedCollegeCode || distinctTopics.length === 0}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {distinctTopics.length === 0 ? (
                      <option value="">No discussion topics found</option>
                    ) : (
                      distinctTopics.map((t) => (
                        <option key={t} value={t}>
                          {t} ({collegeSlots.filter((s) => (s.topic || s.slotName) === t).length} slots)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Step 3: Select Slot */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Select Slot</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedSlotId}
                    disabled={topicSlots.length === 0}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer shadow-xs disabled:opacity-50 font-mono"
                  >
                    {topicSlots.length === 0 ? (
                      <option value="">No slots available</option>
                    ) : (
                      topicSlots.map((sl) => (
                        <option key={sl.id} value={sl.id}>
                          {sl.slotTiming || '10:30 AM'} ({sl.status?.toUpperCase()}) - {sl.enrolledCount ?? sl.students?.length ?? 0} students
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Slot-Wise Reports View */}
          {selectedSlotId ? (
            <SlotStudentReportsView
              key={selectedSlotId}
              slotId={selectedSlotId}
              slotData={currentSelectedSlot}
              collegeName={currentCollege?.name}
            />
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="font-heading font-extrabold text-base text-slate-800 dark:text-slate-200">
                Select an Institution, Topic, and Slot
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Choose a partner college and discussion slot from the filters above to inspect detailed candidate reports.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ONBOARD NEW COLLEGE */}
      {/* ==================================================== */}
      {isOnboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Onboard New Institution
                  </h3>
                  <p className="text-xs text-slate-400">
                    Creates the college profile and auto-provisions the College Admin account.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOnboardOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Institution / College Name
                </label>
                <input
                  type="text"
                  value={newCollege.name}
                  onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                  placeholder="e.g. Vellore Institute of Technology"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    College Code
                  </label>
                  <input
                    type="text"
                    value={newCollege.code}
                    onChange={(e) => setNewCollege({ ...newCollege, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. VIT"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 uppercase font-mono font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newCollege.phone}
                    onChange={(e) => setNewCollege({ ...newCollege, phone: e.target.value })}
                    placeholder="+91 416 224 3091"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  College Admin Contact Email
                </label>
                <input
                  type="email"
                  value={newCollege.contactEmail}
                  onChange={(e) => setNewCollege({ ...newCollege, contactEmail: e.target.value })}
                  placeholder="e.g. admin@vit.ac.in"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    value={newCollege.adminName}
                    onChange={(e) => setNewCollege({ ...newCollege, adminName: e.target.value })}
                    placeholder="e.g. Dr. Anand Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCollege.adminPassword}
                    onChange={(e) => setNewCollege({ ...newCollege, adminPassword: e.target.value })}
                    placeholder="Defaults to Erus@CODE2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Provision Institution & Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VIEW / COPY GENERATED CREDENTIALS */}
      {/* ==================================================== */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-purple-200 dark:border-purple-800 shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-amber-500" />

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  College Admin Credentials
                </h3>
              </div>
              <button onClick={() => setCredentialsModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Provide these credentials to the College Administrator. They can immediately log in through the unified login portal under the <strong>College Admin</strong> tab.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Institution:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{credentialsModal.collegeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Admin ID:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-xs">{credentialsModal.adminId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Login Email:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{credentialsModal.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Password:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">{credentialsModal.password}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Login Portal:</span>
                  <span className="text-slate-600 dark:text-slate-300 text-[11px]">https://erus-production.up.railway.app</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `ERUS Institution Admin Login:\nCollege: ${credentialsModal.collegeName}\nAdmin Email: ${credentialsModal.email}\nPassword: ${credentialsModal.password}\nPortal: https://erus-production.up.railway.app (Select "College Admin" tab)`;
                    copyToClipboard(text);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBannerMsg(`Credentials dispatched to ${credentialsModal.email}.`);
                    setCredentialsModal(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Mail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DELETE COLLEGE CONFIRMATION */}
      {/* ==================================================== */}
      {collegeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  Delete Institution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{collegeToDelete.name}</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-xs">
                  {collegeToDelete.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Deleting this college will permanently remove its institutional records, College Admin credentials, faculty roster ({collegeToDelete.facultyCount || 0}), student profiles ({collegeToDelete.studentCount || 0}), and all scheduled discussion slots.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCollegeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCollege}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete College'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
