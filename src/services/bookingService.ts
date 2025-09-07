import { supabase } from '@/integrations/supabase/client';
import { BookingData, ServiceDetails, UserInfo } from '@/types/booking';

export interface DraftBooking {
  id: string;
  user_id: string;
  service_type: string;
  service_details: any; // Using any to handle Json type from Supabase
  user_info: any; // Using any to handle Json type from Supabase
  booking_progress: string; // Using string to handle any progress value
  total_price?: number;
  created_at: string;
  updated_at: string;
}

export interface BookingStatusUpdate {
  booking_id: string;
  old_status?: string;
  new_status: string;
  notes?: string;
}

// Auto-save draft booking functionality
export const saveDraftBooking = async (
  serviceType: string,
  serviceDetails: ServiceDetails,
  userInfo: UserInfo,
  progress: DraftBooking['booking_progress'],
  totalPrice?: number
): Promise<DraftBooking | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to save booking progress');
  }

  try {
    // Check if existing draft exists
    const { data: existing } = await supabase
      .from('draft_bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_type', serviceType)
      .single();

    const draftData = {
      user_id: user.id,
      service_type: serviceType,
      service_details: serviceDetails as any,
      user_info: userInfo as any,
      booking_progress: progress,
      total_price: totalPrice,
    };

    if (existing) {
      // Update existing draft
      const { data, error } = await supabase
        .from('draft_bookings')
        .update(draftData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from('draft_bookings')
        .insert(draftData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving draft booking:', error);
    throw error;
  }
};

// Get user's draft bookings
export const getDraftBookings = async (): Promise<DraftBooking[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('draft_bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get specific draft booking
export const getDraftBooking = async (id: string): Promise<DraftBooking | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('draft_bookings')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

// Delete draft booking (after successful payment)
export const deleteDraftBooking = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { error } = await supabase
    .from('draft_bookings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// Enhanced booking creation with status tracking
export const createEnhancedBooking = async (
  bookingData: BookingData,
  paymentInfo: {
    paymentMethod: string;
    transactionId: string;
    totalPrice: number;
    requiresVerification?: boolean;
    adminNotes?: string;
    customerNotes?: string;
  }
): Promise<any> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a booking');
  }

  try {
    // Determine payment status based on payment method
    let paymentStatus = 'pending';
    let requiresVerification = false;
    
    if (paymentInfo.paymentMethod === 'Credit Card' || paymentInfo.paymentMethod === 'PayPal') {
      paymentStatus = 'paid';
    } else if (paymentInfo.paymentMethod === 'Bank Transfer') {
      paymentStatus = 'awaiting_verification';
      requiresVerification = true;
    } else if (paymentInfo.paymentMethod === 'Cash on Arrival') {
      paymentStatus = 'cash_on_delivery';
    }

    // Create main booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        service_type: bookingData.serviceType,
        user_info: bookingData.userInfo as any,
        payment_method: paymentInfo.paymentMethod,
        transaction_id: paymentInfo.transactionId,
        total_price: paymentInfo.totalPrice,
        status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
        payment_status: paymentStatus,
        requires_verification: requiresVerification,
        admin_notes: paymentInfo.adminNotes,
        customer_notes: paymentInfo.customerNotes,
        service_details: bookingData.serviceDetails as any
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert into corresponding details table (existing logic)
    let detailError = null;
    switch (bookingData.serviceType) {
      case 'Transportation': {
        const d = bookingData.serviceDetails as any;
        const { error } = await supabase
          .from('transportation_bookings')
          .insert({
            booking_id: booking.id,
            pickup_location: d.pickup,
            dropoff_location: d.dropoff,
            travel_date: d.date,
            travel_time: d.time,
            vehicle_type: d.vehicleType,
            passengers: d.passengers || '1'
          });
        detailError = error;
        break;
      }
      case 'Hotels': {
        const d = bookingData.serviceDetails as any;
        const { error } = await supabase
          .from('hotel_bookings')
          .insert({
            booking_id: booking.id,
            city: d.city,
            hotel_name: d.hotel,
            checkin_date: d.checkin,
            checkout_date: d.checkout,
            room_type: d.roomType,
            guests: d.guests || '1',
            special_requests: d.specialRequests || null
          });
        detailError = error;
        break;
      }
      case 'Events': {
        const d = bookingData.serviceDetails as any;
        const { error } = await supabase
          .from('event_bookings')
          .insert({
            booking_id: booking.id,
            event_name: d.eventName,
            event_location: d.eventLocation,
            event_date: d.eventDate,
            tickets_quantity: d.tickets,
            ticket_type: d.ticketType || 'general'
          });
        detailError = error;
        break;
      }
      case 'Custom Trips': {
        const d = bookingData.serviceDetails as any;
        const { error } = await supabase
          .from('custom_trip_bookings')
          .insert({
            booking_id: booking.id,
            duration: d.duration,
            regions: d.regions,
            interests: d.interests || [],
            budget_range: d.budget || null,
            additional_info: d.additionalInfo || null
          });
        detailError = error;
        break;
      }
    }

    if (detailError) {
      console.error('Error inserting booking details:', detailError);
    }

    return booking;
  } catch (error) {
    console.error('Error in createEnhancedBooking:', error);
    throw error;
  }
};

// Update booking status (for admin use)
export const updateBookingStatus = async (
  bookingId: string,
  newStatus: string,
  paymentStatus?: string,
  adminNotes?: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const updateData: any = { status: newStatus };
  if (paymentStatus) updateData.payment_status = paymentStatus;
  if (adminNotes) updateData.admin_notes = adminNotes;

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId);

  if (error) throw error;
};

// Get booking status history
export const getBookingStatusHistory = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('booking_status_history')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Save payment receipt (for bank transfer verification)
export const savePaymentReceipt = async (
  bookingId: string,
  fileUrl: string,
  fileName: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { error } = await supabase
    .from('payment_receipts')
    .insert({
      booking_id: bookingId,
      file_url: fileUrl,
      file_name: fileName
    });

  if (error) throw error;
};

// Get all bookings with enhanced details (for admin dashboard)
export const getEnhancedBookings = async (filters?: {
  status?: string;
  paymentStatus?: string;
  serviceType?: string;
  requiresVerification?: boolean;
}) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      booking_status_history(id, old_status, new_status, created_at, notes),
      payment_receipts(id, file_name, upload_date, verified_at, verification_notes)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
  if (filters?.serviceType) query = query.eq('service_type', filters.serviceType);
  if (filters?.requiresVerification !== undefined) query = query.eq('requires_verification', filters.requiresVerification);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// Complete draft booking by deleting it (after successful booking creation)
export const completeDraftBooking = async (draftId: string): Promise<void> => {
  await deleteDraftBooking(draftId);
};