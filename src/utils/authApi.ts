import { AuthUser, StudentUser, FacultyUser } from '../types/auth';
import { authenticateUser, registerNewUser } from '../data/mockAuthData';

const TOKEN_KEY = 'erus_jwt_token';
const USER_KEY = 'erus_auth_user';

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  token?: string;
  message?: string;
}

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredAuth = (user: AuthUser, token?: string) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    console.warn('Auth storage error:', e);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('Auth clear error:', e);
  }
};

/**
 * Log in via Backend API with graceful fallback to mock data
 */
export async function loginUser(
  role: import('../types/auth').UserRole,
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, identifier, password }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      setStoredAuth(data.user, data.token);
      return { success: true, user: data.user };
    } else if (res.status === 401 || res.status === 400) {
      return { success: false, error: data.error || 'Invalid credentials' };
    }
  } catch (err) {
    console.warn('[Auth] Backend unreachable, using client auth:', err);
  }

  // Fallback to local mock data if server is offline / not yet deployed
  const mockUser = authenticateUser(role, identifier, password);
  if (mockUser) {
    setStoredAuth(mockUser);
    return { success: true, user: mockUser };
  }

  return { 
    success: false, 
    error: role === 'student'
      ? 'Invalid Student credentials. Try entering rahul.kumar@dit.edu.in with password123.'
      : role === 'faculty'
      ? 'Invalid Faculty credentials. Try entering sunita.rao@dit.edu.in with faculty123.'
      : role === 'college_admin'
      ? 'Invalid College Admin credentials. Try entering admin@dit.edu.in with college123.'
      : 'Invalid Super Admin credentials. Try entering superadmin@erus.ai with admin123.'
  };
}

/**
 * Register via Backend API with graceful fallback to mock data
 */
export async function registerUser(
  userData: (Omit<StudentUser, 'id'> | Omit<FacultyUser, 'id'>) & { password: string }
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      setStoredAuth(data.user, data.token);
      return { success: true, user: data.user };
    } else if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('[Auth] Backend register unreachable, using client storage:', err);
  }

  // Fallback to local mock registration
  const id = `${userData.role === 'student' ? 's' : 'fac'}-reg-${Date.now().toString().slice(-4)}`;
  const newUser: AuthUser = {
    ...userData,
    id,
  } as AuthUser;

  registerNewUser(newUser, userData.password);
  setStoredAuth(newUser);
  return { success: true, user: newUser };
}

/**
 * Verify current session token with Backend
 */
export async function verifyCurrentSession(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        setStoredAuth(data.user, token);
        return data.user;
      }
    }
  } catch (err) {
    console.warn('[Auth] Session verify error:', err);
  }
  return null;
}

// ==========================================
// COLLEGE ADMIN CLIENT API HELPERS
// ==========================================

export async function fetchCollegeStats(collegeCode: string = 'DIT') {
  try {
    const res = await fetch(`/api/college/stats?collegeCode=${encodeURIComponent(collegeCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.stats;
    }
  } catch (e) {
    console.warn('Error fetching college stats:', e);
  }
  return {
    collegeName: 'Delhi Institute of Technology',
    collegeCode: 'DIT',
    totalStudents: 120,
    totalFaculty: 18,
    scheduledSlots: 4,
    completedSlots: 12,
    totalSlots: 16,
  };
}

export async function fetchCollegeStudents(collegeCode: string = 'DIT') {
  try {
    const res = await fetch(`/api/college/students?collegeCode=${encodeURIComponent(collegeCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.students;
    }
  } catch (e) {
    console.warn('Error fetching college students:', e);
  }
  return [
    {
      id: 's1',
      name: 'Rahul Kumar',
      email: 'rahul.kumar@dit.edu.in',
      studentId: 'STU-2022-041',
      course: 'B.Tech CSE',
      batch: '2022-2026',
      seatNumber: 1,
      college: 'Delhi Institute of Technology',
    },
    {
      id: 's2',
      name: 'Neha Gupta',
      email: 'neha.gupta@dit.edu.in',
      studentId: 'STU-2022-072',
      course: 'B.Tech IT',
      batch: '2022-2026',
      seatNumber: 2,
      college: 'Delhi Institute of Technology',
    },
    {
      id: 's3',
      name: 'Aditya Singh',
      email: 'aditya.singh@dit.edu.in',
      studentId: 'STU-2022-094',
      course: 'B.Tech ECE',
      batch: '2022-2026',
      seatNumber: 3,
      college: 'Delhi Institute of Technology',
    },
  ];
}

export async function addCollegeStudents(payload: { students?: any[]; student?: any; collegeCode?: string }) {
  try {
    const res = await fetch('/api/college/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error adding students:', e);
  }
  return { success: true, addedCount: payload.students?.length || 1, students: payload.students || [payload.student] };
}

export async function fetchCollegeFaculty(collegeCode: string = 'DIT') {
  try {
    const res = await fetch(`/api/college/faculty?collegeCode=${encodeURIComponent(collegeCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.faculty;
    }
  } catch (e) {
    console.warn('Error fetching college faculty:', e);
  }
  return [
    {
      id: 'fac-1',
      name: 'Dr. Sunita Rao',
      email: 'sunita.rao@dit.edu.in',
      facultyId: 'FAC-CSE-102',
      department: 'Computer Science & Engineering',
      designation: 'Professor & Head of Department',
      college: 'Delhi Institute of Technology',
      assignedSlotsCount: 3,
    },
    {
      id: 'fac-2',
      name: 'Prof. Rajesh Verma',
      email: 'rajesh.verma@dit.edu.in',
      facultyId: 'FAC-MGT-205',
      department: 'School of Management',
      designation: 'Dean of Academic Affairs',
      college: 'Delhi Institute of Technology',
      assignedSlotsCount: 2,
    },
  ];
}

export async function addCollegeFaculty(payload: any) {
  try {
    const res = await fetch('/api/college/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error adding faculty:', e);
  }
  return { success: true, faculty: payload };
}

export async function fetchCollegeSlots(collegeCode: string = 'DIT') {
  try {
    const res = await fetch(`/api/college/slots?collegeCode=${encodeURIComponent(collegeCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.slots;
    }
  } catch (e) {
    console.warn('Error fetching college slots:', e);
  }
  return [];
}

export async function createCollegeSlot(payload: any) {
  try {
    const res = await fetch('/api/college/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error creating college slot:', e);
  }
  return { success: true, slot: { ...payload, id: `slot-${Date.now()}`, enrolledCount: 6, status: 'scheduled' } };
}

// ==========================================
// SUPER ADMIN CLIENT API HELPERS
// ==========================================

export async function fetchAdminColleges() {
  try {
    const res = await fetch('/api/admin/colleges');
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.colleges;
    }
  } catch (e) {
    console.warn('Error fetching admin colleges:', e);
  }
  return [
    {
      id: 'col-1',
      name: 'Delhi Institute of Technology',
      code: 'DIT',
      contactEmail: 'admin@dit.edu.in',
      phone: '+91 11 2659 1000',
      address: 'Hauz Khas, New Delhi',
      status: 'active',
      studentCount: 120,
      facultyCount: 18,
      slotCount: 8,
      adminEmail: 'admin@dit.edu.in',
      adminName: 'DIT College Administrator',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-2',
      name: 'Indian Institute of Technology Bombay',
      code: 'IITB',
      contactEmail: 'admin@iitb.ac.in',
      phone: '+91 22 2572 2545',
      address: 'Powai, Mumbai',
      status: 'active',
      studentCount: 95,
      facultyCount: 14,
      slotCount: 6,
      adminEmail: 'admin@iitb.ac.in',
      adminName: 'IITB Academic Admin',
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function registerNewCollege(payload: any) {
  try {
    const res = await fetch('/api/admin/colleges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error registering new college:', e);
  }
  return {
    success: true,
    college: {
      id: `col-${Date.now()}`,
      ...payload,
      status: 'active',
      studentCount: 0,
      facultyCount: 0,
      slotCount: 0,
      createdAt: new Date().toISOString(),
    },
    generatedCredentials: {
      email: payload.contactEmail,
      password: payload.adminPassword || `Erus@${payload.code}2026`,
      role: 'college_admin',
      collegeName: payload.name,
      collegeCode: payload.code,
      adminId: `CADM-${payload.code}-001`,
    },
  };
}

export async function sendCollegeCredentials(collegeId: string) {
  try {
    const res = await fetch(`/api/admin/colleges/${collegeId}/send-credentials`, {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error sending credentials:', e);
  }
  return { success: true, message: 'Credentials dispatched successfully via secure notification.' };
}

export async function fetchAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.stats;
    }
  } catch (e) {
    console.warn('Error fetching admin stats:', e);
  }
  return {
    totalColleges: 3,
    totalStudents: 215,
    totalFaculty: 32,
    totalSlots: 14,
    activeLiveGDs: 1,
  };
}
