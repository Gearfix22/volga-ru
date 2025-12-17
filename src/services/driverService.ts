import { supabase } from '@/integrations/supabase/client';

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DriverNotification {
  id: string;
  driver_id: string;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AssignedBooking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number | null;
  created_at: string;
  user_info: any;
  service_details: any;
  customer_notes: string | null;
}

// Get all available (active) drivers
export async function getAvailableDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'active')
    .order('full_name');
  
  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
  
  return data as Driver[];
}

// Get all drivers for admin
export async function getAllDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('full_name');
  
  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
  
  return data as Driver[];
}

// Assign driver to booking
export async function assignDriverToBooking(bookingId: string, driverId: string | null): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  const response = await fetch(
    `https://tujborgbqzmcwolntvas.supabase.co/functions/v1/admin-bookings/${bookingId}/assign-driver`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ driver_id: driverId }),
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    return { success: false, error: result.error || 'Failed to assign driver' };
  }

  return { success: true };
}

// Auto-assign best available driver
export async function autoAssignDriver(bookingId: string): Promise<{ success: boolean; driverId?: string; driverName?: string; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  const response = await fetch(
    `https://tujborgbqzmcwolntvas.supabase.co/functions/v1/admin-bookings/${bookingId}/auto-assign`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    return { success: false, error: result.error || 'Failed to auto-assign driver' };
  }

  return { success: true, driverId: result.driver_id, driverName: result.driver_name };
}

// Get bookings assigned to current driver
export async function getDriverAssignedBookings(): Promise<AssignedBooking[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('assigned_driver_id', user.id)
    .in('status', ['confirmed', 'pending'])
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching assigned bookings:', error);
    return [];
  }
  
  return data as AssignedBooking[];
}

// Get driver notifications
export async function getDriverNotifications(limit: number = 20): Promise<DriverNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('driver_notifications')
    .select('*')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching driver notifications:', error);
    return [];
  }
  
  return data as DriverNotification[];
}

// Mark driver notification as read
export async function markDriverNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('driver_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  
  return true;
}

// Update booking status by driver
export async function updateBookingStatusByDriver(bookingId: string, status: 'in_progress' | 'completed'): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId);
  
  if (error) {
    console.error('Error updating booking status:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// Subscribe to new driver notifications
export function subscribeToDriverNotifications(
  driverId: string,
  callback: (notification: DriverNotification) => void
) {
  const channel = supabase
    .channel('driver-notifications-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_notifications',
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        callback(payload.new as DriverNotification);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to assigned booking changes
export function subscribeToAssignedBookings(
  driverId: string,
  callback: (booking: any) => void
) {
  const channel = supabase
    .channel('driver-bookings-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `assigned_driver_id=eq.${driverId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}
