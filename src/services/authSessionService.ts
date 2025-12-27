import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'driver' | 'user' | 'moderator' | 'guide';
export type EventType = 'login' | 'logout';

export interface AuthSession {
  id: string;
  user_id: string;
  user_role: string;
  event_type: EventType;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Log a login/logout event to auth_sessions table
 */
export async function logAuthEvent(
  userId: string,
  userRole: UserRole,
  eventType: EventType
): Promise<void> {
  try {
    const { error } = await supabase
      .from('auth_sessions')
      .insert({
        user_id: userId,
        user_role: userRole,
        event_type: eventType,
        user_agent: navigator.userAgent,
        ip_address: null // IP is captured server-side if needed
      });

    if (error) {
      console.error('Error logging auth event:', error);
    }
  } catch (err) {
    console.error('Failed to log auth event:', err);
  }
}

/**
 * Get auth session history for admin view
 */
export async function getAuthSessionHistory(limit: number = 100): Promise<AuthSession[]> {
  const { data, error } = await supabase
    .from('auth_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching auth sessions:', error);
    return [];
  }

  return data as AuthSession[];
}

/**
 * Get auth sessions for a specific user
 */
export async function getUserAuthSessions(userId: string, limit: number = 20): Promise<AuthSession[]> {
  const { data, error } = await supabase
    .from('auth_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user auth sessions:', error);
    return [];
  }

  return data as AuthSession[];
}
