import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 
  | 'booking_update' 
  | 'payment' 
  | 'driver_assigned' 
  | 'driver_arrival' 
  | 'trip_complete' 
  | 'general';

export interface CustomerNotification {
  id: string;
  user_id: string;
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
  const { data, error } = await supabase
    .from('customer_notifications')
    .select('*')
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
  const { data, error } = await supabase
    .from('customer_notifications')
    .select('*')
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
    .from('customer_notifications')
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
  const { error } = await supabase
    .from('customer_notifications')
    .update({ is_read: true })
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
    .channel('customer-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'customer_notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as CustomerNotification);
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
