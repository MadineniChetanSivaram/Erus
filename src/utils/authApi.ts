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
  role: 'student' | 'faculty',
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
      // Intentional invalid credentials from backend
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
      ? 'Invalid Student credentials. Try entering rahul.kumar@dit.edu.in with password123, or register as a new student.'
      : 'Invalid Faculty credentials. Try entering sunita.rao@dit.edu.in with faculty123, or register as a new faculty.'
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
