import { supabase } from '@/integrations/supabase/client';

const EDGE_FUNCTION_URL = 'https://tujborgbqzmcwolntvas.supabase.co/functions/v1/admin-bookings';

interface AdminApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export interface BookingFilters {
  status?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
}

// GET /admin-bookings - List all bookings with filters
export async function getAdminBookings(filters?: BookingFilters) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.payment_status) params.append('payment_status', filters.payment_status);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);

  const queryString = params.toString();
  const url = queryString ? `${EDGE_FUNCTION_URL}?${queryString}` : EDGE_FUNCTION_URL;

  const response = await fetch(url, { headers });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch bookings');
  }
  
  return data.bookings;
}

// GET /admin-bookings/:id - Get single booking
export async function getAdminBooking(bookingId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${EDGE_FUNCTION_URL}/${bookingId}`, { headers });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch booking');
  }
  
  return data.booking;
}

// POST /admin-bookings/:id/confirm - Confirm booking
export async function confirmBooking(bookingId: string): Promise<AdminApiResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${EDGE_FUNCTION_URL}/${bookingId}/confirm`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to confirm booking');
  }
  
  return data;
}

// POST /admin-bookings/:id/reject - Reject booking with reason
export async function rejectBooking(bookingId: string, reason: string): Promise<AdminApiResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${EDGE_FUNCTION_URL}/${bookingId}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to reject booking');
  }
  
  return data;
}

// PUT /admin-bookings/:id - Update booking fields
export async function updateBooking(
  bookingId: string, 
  updates: { status?: string; payment_status?: string; admin_notes?: string; total_price?: number }
): Promise<AdminApiResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${EDGE_FUNCTION_URL}/${bookingId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update booking');
  }
  
  return data;
}

// POST /admin-bookings/:id/payment - Update payment status
export async function updatePaymentStatus(bookingId: string, payment_status: string): Promise<AdminApiResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${EDGE_FUNCTION_URL}/${bookingId}/payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ payment_status }),
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update payment status');
  }
  
  return data;
}

// DELETE /admin-bookings/:id - Delete booking
export async function deleteBooking(bookingId: string): Promise<AdminApiResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${EDGE_FUNCTION_URL}/${bookingId}`, {
    method: 'DELETE',
    headers,
  });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete booking');
  }
  
  return data;
}

// Fetch admin logs
export async function getAdminLogs(limit: number = 50) {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// Log admin action (for client-side actions)
export async function logAdminAction(actionType: string, targetId: string | null, targetTable: string, payload: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('admin_logs').insert({
    admin_id: user.id,
    action_type: actionType,
    target_id: targetId,
    target_table: targetTable,
    payload
  });

  if (error) throw error;
}

// Update user profile (admin only)
export async function updateUserProfile(userId: string, updates: { full_name?: string; phone?: string; phone_verified?: boolean }) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  
  await logAdminAction('user_updated', userId, 'profiles', updates);
}

// Update user role
export async function updateUserRole(userId: string, newRole: 'admin' | 'user' | 'driver') {
  // First delete existing roles
  await supabase.from('user_roles').delete().eq('user_id', userId);
  
  // Insert new role
  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: newRole
  });
  
  if (error) throw error;
  
  await logAdminAction('role_changed', userId, 'user_roles', { new_role: newRole });
}

// Disable user (admin only) - marks profile as deleted, doesn't remove auth user
export async function disableUser(userId: string) {
  // Update profile to indicate disabled
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: '[DISABLED USER]' })
    .eq('id', userId);
  
  if (error) throw error;
  
  // Remove all roles except 'user'
  await supabase.from('user_roles').delete().eq('user_id', userId);
  
  await logAdminAction('user_disabled', userId, 'profiles', { disabled: true });
}

// Delete user profile and related data (admin only) - full deletion
export async function deleteUser(userId: string) {
  // Delete user bookings first (if allowed by your business rules)
  // Note: This may fail if bookings have foreign key constraints
  
  // Delete user roles first
  await supabase.from('user_roles').delete().eq('user_id', userId);
  
  // Delete draft bookings
  await supabase.from('draft_bookings').delete().eq('user_id', userId);
  
  // Delete user activities
  await supabase.from('user_activities').delete().eq('user_id', userId);
  
  // Delete user preferences
  await supabase.from('user_preferences').delete().eq('user_id', userId);
  
  // Delete user profile
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  
  if (error) throw error;
  
  await logAdminAction('user_deleted', userId, 'profiles', { deleted: true });
}

// Check if phone number already exists (for duplicate prevention)
export async function checkPhoneExists(phone: string, excludeUserId?: string): Promise<boolean> {
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone);
  
  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }
  
  const { data, error } = await query.limit(1);
  
  if (error) throw error;
  return (data?.length || 0) > 0;
}