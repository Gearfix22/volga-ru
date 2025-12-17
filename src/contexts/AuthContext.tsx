
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: string[];
  signUp: (email: string, password: string, phone: string, fullName: string, role?: string) => Promise<{ error: any }>;
  signUpWithPhone: (phone: string, password: string, fullName: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string, type: 'sms' | 'phone_change') => Promise<{ error: any }>;
  sendOtp: (phone: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchUserRoles = async (userId: string) => {
    setRolesLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (!error && data) {
        setUserRoles(data.map(r => r.role));
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer role fetching to avoid deadlock
        setTimeout(() => {
          fetchUserRoles(session.user.id);
        }, 0);
      } else {
        setUserRoles([]);
      }
      
      // Track auth events (delayed to avoid circular dependency)
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(async () => {
          try {
            await supabase
              .from('user_activities')
              .insert({
                user_id: session.user.id,
                activity_type: 'login',
                activity_data: {
                  userId: session.user.id,
                  email: session.user.email,
                  loginMethod: session.user.app_metadata?.provider || 'email'
                },
                activity_description: 'Logged into the platform'
              });
          } catch (error) {
            console.error('Error logging login activity:', error);
          }
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: string) => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => userRoles.includes(role));
  };

  const signUp = async (email: string, password: string, phone: string, fullName: string, role: string = 'user') => {
    // Check phone uniqueness before signup
    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('phone')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhone) {
      return { 
        error: { 
          message: 'Phone number already registered',
          status: 409 
        } 
      };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          phone,
          full_name: fullName,
          role
        }
      }
    });
    return { error };
  };

  const signUpWithPhone = async (phone: string, password: string, fullName: string, role: string = 'user') => {
    const { error } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithPhone = async (phone: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });
    return { error };
  };

  const verifyOtp = async (phone: string, token: string, type: 'sms' | 'phone_change' = 'sms') => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type,
    });
    return { error };
  };

  const sendOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    userRoles,
    signUp,
    signUpWithPhone,
    signIn,
    signInWithPhone,
    verifyOtp,
    sendOtp,
    signOut,
    hasRole,
    hasAnyRole,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
