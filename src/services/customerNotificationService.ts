import { supabase } from '@/integrations/supabase/client';

/**
 * Customer Notification Service
 * Uses the unified_notifications table with recipient_type = 'user'
 */

export type NotificationType = 
  | 'booking_update' 
  | 'payment' 
  | 'driver_assigned' 
  | 'driver_arrival' 
  | 'trip_complete' 
  | 'general';

export interface CustomerNotification {
  id: string;
  recipient_id: string;
  recipient_type: string;
  booking_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get unread notifications for current user
 */
export async function getUnreadCustomerNotifications(): Promise<CustomerNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('unified_notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .eq('recipient_type', 'user')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }

  return data as CustomerNotification[];
}

/**
 * Get all notifications for current user
 */
export async function getAllCustomerNotifications(limit: number = 50): Promise<CustomerNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('unified_notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .eq('recipient_type', 'user')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data as CustomerNotification[];
}

/**
 * Mark a notification as read
 */
export async function markCustomerNotificationAsRead(notificationId: string): Promise<boolean> {
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
 * Mark all notifications as read
 */
export async function markAllCustomerNotificationsAsRead(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('unified_notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('recipient_type', 'user')
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

/**
 * Subscribe to new customer notifications
 */
export function subscribeToCustomerNotifications(
  userId: string,
  callback: (notification: CustomerNotification) => void
) {
  const channel = supabase
    .channel(`customer-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'unified_notifications',
        filter: `recipient_id=eq.${userId}`
      },
      (payload) => {
        // Only process user type notifications
        if (payload.new && (payload.new as any).recipient_type === 'user') {
          callback(payload.new as CustomerNotification);
        }
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
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'booking_update': return '📋';
    case 'payment': return '💳';
    case 'driver_assigned': return '🚗';
    case 'driver_arrival': return '📍';
    case 'trip_complete': return '✅';
    case 'general': return '🔔';
    default: return '🔔';
  }
}
