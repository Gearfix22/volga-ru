
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { trackUserAction } from '@/services/userActivityService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, phone?: string) => Promise<{ error: any }>;
  signUpWithPhone: (phone: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string, type: 'sms' | 'phone_change') => Promise<{ error: any }>;
  sendOtp: (phone: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Track auth events
      if (event === 'SIGNED_IN' && session?.user) {
        await trackUserAction('login', {
          userId: session.user.id,
          email: session.user.email,
          loginMethod: session.user.app_metadata?.provider || 'email'
        });
      } else if (event === 'SIGNED_OUT') {
        await trackUserAction('logout');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, phone?: string) => {
    const signUpData: any = {
      email,
      password,
      options: {
        data: {}
      }
    };

    if (phone) {
      signUpData.options.data.phone = phone;
    }

    const { error } = await supabase.auth.signUp(signUpData);
    return { error };
  };

  const signUpWithPhone = async (phone: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      phone,
      password,
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
    if (user) {
      await trackUserAction('logout', { userId: user.id });
    }
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signUpWithPhone,
    signIn,
    signInWithPhone,
    verifyOtp,
    sendOtp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
