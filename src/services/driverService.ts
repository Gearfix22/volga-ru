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

// Get bookings assigned to current driver - unified status flow
// CRITICAL: Include 'confirmed' status for backward compatibility with older bookings
export async function getDriverAssignedBookings(): Promise<AssignedBooking[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('getDriverAssignedBookings: No authenticated user');
    return [];
  }

  console.log('Fetching bookings for driver:', user.id);

  const { data, error } = await supabase
    .from('bookings')
    .select('*, driver_response')
    .eq('assigned_driver_id', user.id)
    .in('status', ['assigned', 'confirmed', 'accepted', 'on_trip', 'completed'])
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching assigned bookings:', error.message, error.details, error.hint);
    return [];
  }
  
  console.log('Driver bookings fetched:', data?.length || 0, 'bookings');
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

// Update booking status by driver - unified status: pending → assigned → accepted → on_trip → completed
export async function updateBookingStatusByDriver(
  bookingId: string, 
  status: 'accepted' | 'on_trip' | 'completed'
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('updateBookingStatusByDriver: No authenticated user');
    return { success: false, error: 'Not authenticated' };
  }
  
  console.log('Driver updating booking status:', bookingId, 'to:', status, 'by driver:', user.id);
  
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', bookingId)
    .eq('assigned_driver_id', user.id) // Security: only allow driver to update their own assignments
    .select();
  
  if (error) {
    console.error('Error updating booking status:', error.message, error.details, error.hint);
    return { success: false, error: error.message };
  }
  
  if (!data || data.length === 0) {
    console.error('No booking updated - may not be assigned to this driver');
    return { success: false, error: 'Booking not found or not assigned to you' };
  }
  
  console.log('Booking status updated successfully:', data);
  return { success: true };
}

// Driver accepts a booking assignment
export async function acceptBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('acceptBooking: No authenticated user');
    return { success: false, error: 'Not authenticated' };
  }
  
  console.log('Driver accepting booking:', bookingId, 'by driver:', user.id);
  
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      driver_response: 'accepted',
      driver_response_at: new Date().toISOString(),
      status: 'accepted',
      updated_at: new Date().toISOString() 
    })
    .eq('id', bookingId)
    .eq('assigned_driver_id', user.id) // Security: only allow driver to update their own assignments
    .select();
  
  if (error) {
    console.error('Error accepting booking:', error.message, error.details, error.hint);
    return { success: false, error: error.message };
  }
  
  if (!data || data.length === 0) {
    console.error('No booking updated - may not be assigned to this driver');
    return { success: false, error: 'Booking not found or not assigned to you' };
  }
  
  console.log('Booking accepted successfully:', data);
  return { success: true };
}

// Driver rejects a booking assignment
export async function rejectBookingByDriver(
  bookingId: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('rejectBookingByDriver: No authenticated user');
    return { success: false, error: 'Not authenticated' };
  }
  
  console.log('Driver rejecting booking:', bookingId, 'by driver:', user.id);
  
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      driver_response: 'rejected',
      driver_response_at: new Date().toISOString(),
      driver_notes: notes || null,
      assigned_driver_id: null, // Unassign driver so admin can reassign
      status: 'confirmed', // Reset to confirmed so admin can reassign
      updated_at: new Date().toISOString() 
    })
    .eq('id', bookingId)
    .eq('assigned_driver_id', user.id) // Security: only allow driver to reject their own assignments
    .select();
  
  if (error) {
    console.error('Error rejecting booking:', error.message, error.details, error.hint);
    return { success: false, error: error.message };
  }
  
  if (!data || data.length === 0) {
    console.error('No booking updated - may not be assigned to this driver');
    return { success: false, error: 'Booking not found or not assigned to you' };
  }
  
  console.log('Booking rejected successfully:', data);
  return { success: true };
}

// Get driver details for customer view
export async function getDriverForBooking(bookingId: string): Promise<Driver | null> {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('assigned_driver_id, show_driver_to_customer, driver_response')
    .eq('id', bookingId)
    .single();
  
  if (bookingError || !booking || !booking.assigned_driver_id || !booking.show_driver_to_customer) {
    return null;
  }
  
  // Only show driver if they've accepted
  if (booking.driver_response !== 'accepted') {
    return null;
  }
  
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', booking.assigned_driver_id)
    .single();
  
  if (driverError || !driver) {
    return null;
  }
  
  return driver as Driver;
}

// Toggle driver visibility for customer
export async function toggleDriverVisibility(
  bookingId: string, 
  showDriver: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('bookings')
    .update({ show_driver_to_customer: showDriver })
    .eq('id', bookingId);
  
  if (error) {
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
