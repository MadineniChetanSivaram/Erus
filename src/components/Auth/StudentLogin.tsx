import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserCheck,
  UserPlus,
  Building,
  BookOpen,
  Hash,
  CheckCircle2,
  User,
  Sparkles,
  Zap
} from 'lucide-react';
import { StudentUser } from '../../types/auth';
import { MOCK_STUDENTS, authenticateUser, registerNewUser } from '../../data/mockAuthData';
import { loginUser, registerUser, setStoredAuth, fetchAdminColleges } from '../../utils/authApi';

interface StudentLoginProps {
  onLogin: (user: StudentUser) => void;
  onSwitchToFaculty: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  onLogin,
  onSwitchToFaculty,
}) => {
  const [authMode, setAuthMode] = useState<'quick' | 'signin' | 'register'>('quick');
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);

  React.useEffect(() => {
    fetchAdminColleges().then((list) => {
      if (list && list.length > 0) setAvailableColleges(list);
    });
  }, []);

  // Quick Join Form States (for seamless live testing tomorrow)
  const [quickName, setQuickName] = useState('');
  const [quickCollege, setQuickCollege] = useState('');

  // Login Form States
  const [identifier, setIdentifier] = useState('rahul.kumar@dit.edu.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regCollege, setRegCollege] = useState('');
  const [regCourse, setRegCourse] = useState('B.Tech CSE');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!quickName.trim()) {
      setError('Please enter your full name to join.');
      return;
    }

    setIsLoading(true);
    const cleanName = quickName.trim();
    const cleanCollege = quickCollege.trim() || 'Engineering Institute';
    const emailStub = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now().toString().slice(-3)}@live.erus.ai`;

    const quickUser: StudentUser = {
      id: `s-live-${Date.now().toString().slice(-6)}`,
      name: cleanName,
      email: emailStub,
      role: 'student',
      studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      college: cleanCollege,
      course: 'B.Tech',
      batch: '2024-2028',
      seatNumber: 1,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
    };

    setStoredAuth(quickUser);
    setIsLoading(false);
    setSuccessMsg(`Welcome, ${cleanName}! Entering the GD Conference Room...`);
    setTimeout(() => {
      onLogin(quickUser);
    }, 400);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!identifier.trim()) {
      setError('Please enter your Student ID or Email address.');
      return;
    }

    setIsLoading(true);
    const res = await loginUser('student', identifier, password);
    setIsLoading(false);

    if (res.success && res.user && res.user.role === 'student') {
      onLogin(res.user as StudentUser);
    } else {
      setError(res.error || 'Invalid Student credentials. Try Quick Join with your name, or enter rahul.kumar@dit.edu.in with password123.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regCollege.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    const res = await registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      role: 'student',
      studentId: regStudentId.trim() || `STU-${Date.now().toString().slice(-4)}`,
      college: regCollege.trim(),
      course: regCourse.trim() || 'General Engineering',
      batch: '2024-2028',
      seatNumber: 1,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      password: regPassword,
    });
    setIsLoading(false);

    if (res.success && res.user && res.user.role === 'student') {
      setSuccessMsg('Account created successfully! Logging you into the GD Conference Room...');
      setTimeout(() => {
        onLogin(res.user as StudentUser);
      }, 700);
    } else {
      setError(res.error || 'Registration failed. Please check your information and try again.');
    }
  };

  const handleQuickLogin = (student: typeof MOCK_STUDENTS[0]) => {
    setIdentifier(student.email);
    setPassword(student.password);
    setError(null);
    const { password: _, ...user } = student;
    onLogin(user);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-500/5 transition-all">
      
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-indigo-950/50 shrink-0">
            {authMode === 'quick' ? <Zap className="w-6 h-6" /> : authMode === 'register' ? <UserPlus className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {authMode === 'quick' ? 'Instant Student Join' : authMode === 'register' ? 'Student Registration' : 'Student Portal'}
              </h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Participant
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'quick'
                ? 'Enter your name to join live GD test sessions directly with zero setup'
                : authMode === 'register'
                ? 'Create your permanent account to join academic discussion slots'
                : 'Sign in to join the active Group Discussion room & view your scorecards'}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle Pills (Instant Join vs Sign In vs Register) */}
      <div className="flex p-1 mb-6 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setAuthMode('quick');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            authMode === 'quick'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ⚡ Quick Join
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('signin');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            authMode === 'signin'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('register');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            authMode === 'register'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Register
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 0. INSTANT QUICK JOIN FORM */}
      {authMode === 'quick' && (
        <form onSubmit={handleQuickJoinSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Join immediately with your real name. No password required for test sessions!</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Your Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="e.g. Chetan Sivaram, Kavya Patel"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              College or University (Optional)
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickCollege}
                onChange={(e) => setQuickCollege(e.target.value)}
                placeholder="e.g. Delhi Institute of Technology"
                list="student-college-suggestions"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !quickName.trim()}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter GD Room as Student</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      {/* 1. SIGN IN FORM */}
      {authMode === 'signin' && (
        <>
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Student ID or College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rahul.kumar@dit.edu.in or STU-2022-041"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 hover:text-indigo-600 cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Student</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Quick Demo Presets */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>1-Click Test Profiles:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Password: password123</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOCK_STUDENTS.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleQuickLogin(student)}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 text-left transition-all group cursor-pointer"
                >
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {student.name}
                      </p>
                      <span className="text-[9px] font-mono px-1 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Seat {student.seatNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {student.course}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 2. REGISTRATION FORM */}
      {authMode === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="e.g. Kavita Sharma"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College / Institution *
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regCollege}
                  onChange={(e) => setRegCollege(e.target.value)}
                  placeholder="e.g. IIT Delhi"
                  list="student-college-suggestions"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <datalist id="student-college-suggestions">
                  {(availableColleges.length > 0 ? availableColleges : [
                    { code: 'DIT', name: 'Delhi Institute of Technology' },
                    { code: 'IITB', name: 'Indian Institute of Technology Bombay' }
                  ]).map((col) => (
                    <option key={col.code} value={col.name}>
                      {col.code} - {col.name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course / Branch *
              </label>
              <div className="relative">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regCourse}
                  onChange={(e) => setRegCourse(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Roll / ID
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  placeholder="e.g. STU-2024-512"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Student Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Switch to Faculty Portal */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Are you a faculty member, mentor, or evaluator?{' '}
          <button
            type="button"
            onClick={onSwitchToFaculty}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Faculty Portal</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </p>
      </div>
    </div>
  );
};
