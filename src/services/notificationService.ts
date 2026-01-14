import { supabase } from '@/integrations/supabase/client';

/**
 * Unified Notification Service
 * Uses the unified_notifications table for all recipient types
 */

export type RecipientType = 'user' | 'admin' | 'driver' | 'guide';

export type NotificationType = 
  | 'booking_update' 
  | 'payment' 
  | 'driver_assigned' 
  | 'driver_arrival' 
  | 'trip_complete' 
  | 'new_booking'
  | 'status_change'
  | 'payment_update'
  | 'general';

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: RecipientType;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get unread notifications for admins
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('unified_notifications')
    .select('*')
    .eq('recipient_type', 'admin')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data as Notification[];
}

/**
 * Get all notifications for admins
 */
export async function getAllNotifications(limit: number = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('unified_notifications')
    .select('*')
    .eq('recipient_type', 'admin')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data as Notification[];
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('unified_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  
  return true;
}

/**
 * Mark all admin notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const { error } = await supabase
    .from('unified_notifications')
    .update({ is_read: true })
    .eq('recipient_type', 'admin')
    .eq('is_read', false);
  
  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
  
  return true;
}

/**
 * Subscribe to new admin notifications
 */
export function subscribeToNotifications(callback: (notification: Notification) => void) {
  const channel = supabase
    .channel('admin-notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'unified_notifications',
        filter: `recipient_type=eq.admin`
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'new_booking': return '📦';
    case 'booking_update': return '📋';
    case 'status_change': return '🔄';
    case 'payment': 
    case 'payment_update': return '💳';
    case 'driver_assigned': return '🚗';
    case 'driver_arrival': return '📍';
    case 'trip_complete': return '✅';
    case 'general': return '🔔';
    default: return '📌';
  }
}
