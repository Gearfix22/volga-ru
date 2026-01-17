/**
 * Authentication types for the application
 * Properly typed auth context and error handling
 */

import type { User, Session, AuthError } from '@supabase/supabase-js';

// ============================================
// AUTH ERROR TYPES
// ============================================

export interface AuthErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

export type AuthResult = { 
  error: AuthError | AuthErrorResponse | null 
};

// ============================================
// AUTH CONTEXT TYPES
// ============================================

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: string[];
  signUp: (email: string, password: string, phone: string, fullName: string, role?: string) => Promise<AuthResult>;
  signUpWithPhone: (phone: string, password: string, fullName: string, role?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithPhone: (phone: string, password: string) => Promise<AuthResult>;
  verifyOtp: (phone: string, token: string, type: 'sms' | 'phone_change') => Promise<AuthResult>;
  sendOtp: (phone: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
}

// ============================================
// SESSION LOGGING TYPES
// ============================================

export type UserRoleType = 'user' | 'admin' | 'driver' | 'guide';
export type AuthEventType = 'login' | 'logout' | 'signup' | 'password_reset';

export interface AuthSessionRecord {
  id: string;
  user_id: string;
  user_role: UserRoleType;
  event_type: AuthEventType;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
