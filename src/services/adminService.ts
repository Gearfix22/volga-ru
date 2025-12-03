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