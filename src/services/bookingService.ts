import { supabase } from '@/integrations/supabase/client';
import { BookingData, ServiceDetails, UserInfo, SERVICE_PRICING, ServiceType } from '@/types/booking';

export interface DraftBooking {
  id: string;
  user_id: string;
  service_type: string;
  service_details: any;
  user_info: any;
  booking_progress: string;
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
// SINGLE DRAFT PER USER - prevents duplicates
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
    // Check for ANY existing draft for this user (single draft per user)
    const { data: existing } = await supabase
      .from('draft_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const draftData = {
      user_id: user.id,
      service_type: serviceType,
      service_details: serviceDetails as any,
      user_info: userInfo as any,
      booking_progress: progress,
      total_price: totalPrice,
    };

    if (existing) {
      // Update existing draft (even if service type changed)
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

// Get the latest draft for user (should only be one)
export const getLatestDraft = async (): Promise<DraftBooking | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('draft_bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error getting latest draft:', error);
    return null;
  }
  return data;
};

// Legacy function - returns array but should only have 0-1 drafts
export const getDraftBookings = async (): Promise<DraftBooking[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('draft_bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error getting drafts:', error);
    return [];
  }
  return data || [];
};

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
    .maybeSingle();

  if (error) throw error;
  return data;
};

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

/**
 * UNIFIED BOOKING CREATION
 * 
 * NORMALIZED STATUS FLOW:
 * pending (REQUESTED) → confirmed (ADMIN_REVIEW) → assigned (DRIVER_ASSIGNED) 
 * → accepted (DRIVER_CONFIRMED) → on_trip (IN_PROGRESS) → completed → paid/closed
 * 
 * Payment rules:
 * - Visa/Credit Card: Auto-confirm (status: confirmed), notify driver when assigned
 * - Cash on arrival: status: pending, admin must confirm
 * - Bank Transfer: status: pending, requires verification
 */
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
    // Determine status based on payment method
    let bookingStatus = 'pending'; // Default = REQUESTED
    let paymentStatus = 'pending';
    let requiresVerification = false;
    
    const normalizedPaymentMethod = paymentInfo.paymentMethod.toLowerCase();
    
    // VISA / Credit Card = auto-confirm, moves to ADMIN_REVIEW
    if (normalizedPaymentMethod.includes('visa') || 
        normalizedPaymentMethod.includes('credit') || 
        normalizedPaymentMethod.includes('card') ||
        normalizedPaymentMethod.includes('stripe')) {
      bookingStatus = 'confirmed'; // ADMIN_REVIEW - ready for driver assignment
      paymentStatus = 'paid';
    }
    // Cash = pending for admin (REQUESTED)
    else if (normalizedPaymentMethod.includes('cash')) {
      bookingStatus = 'pending';
      paymentStatus = 'cash_on_delivery';
    }
    // Bank Transfer = pending verification (REQUESTED)
    else if (normalizedPaymentMethod.includes('bank')) {
      bookingStatus = 'pending';
      paymentStatus = 'awaiting_verification';
      requiresVerification = true;
    }

    // Check if service requires admin pricing (Accommodation, Events)
    const requiresAdminPricing = bookingData.serviceType === 'Accommodation' || bookingData.serviceType === 'Events';
    
    // For services requiring admin pricing, always start as pending
    if (requiresAdminPricing && paymentInfo.totalPrice === 0) {
      bookingStatus = 'pending';
      paymentStatus = 'awaiting_quote';
    }

    // Driver service ALWAYS requires a driver - no user toggle needed
    const driverRequired = bookingData.serviceType === 'Driver';

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
        status: bookingStatus,
        payment_status: paymentStatus,
        requires_verification: requiresVerification,
        admin_notes: paymentInfo.adminNotes,
        customer_notes: paymentInfo.customerNotes,
        service_details: bookingData.serviceDetails as any,
        driver_required: driverRequired
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert into corresponding details table based on service type
    await insertServiceDetails(booking.id, bookingData);

    console.log(`Booking created: ${booking.id}, Status: ${bookingStatus}, Payment: ${paymentStatus}`);

    return booking;
  } catch (error) {
    console.error('Error in createEnhancedBooking:', error);
    throw error;
  }
};

// Helper function to insert service-specific details
async function insertServiceDetails(bookingId: string, bookingData: BookingData) {
  const d = bookingData.serviceDetails as any;
  let error = null;

  switch (bookingData.serviceType) {
    case 'Driver':
    case 'Transportation': {
      const { error: e } = await supabase
        .from('transportation_bookings')
        .insert({
          booking_id: bookingId,
          pickup_location: d.pickupLocation || d.pickup,
          dropoff_location: d.dropoffLocation || d.dropoff,
          travel_date: d.pickupDate || d.date,
          travel_time: d.pickupTime || d.time,
          vehicle_type: d.vehicleType,
          passengers: d.passengers || '1'
        });
      error = e;
      break;
    }
    case 'Accommodation':
    case 'Hotels': {
      const { error: e } = await supabase
        .from('hotel_bookings')
        .insert({
          booking_id: bookingId,
          city: d.location || d.city,
          hotel_name: d.hotel || 'TBD',
          checkin_date: d.checkIn || d.checkin,
          checkout_date: d.checkOut || d.checkout,
          room_type: d.roomPreference || d.roomType || 'standard',
          guests: d.guests || '1',
          special_requests: d.specialRequests || null
        });
      error = e;
      break;
    }
    case 'Events': {
      const { error: e } = await supabase
        .from('event_bookings')
        .insert({
          booking_id: bookingId,
          event_name: d.eventName || d.eventType,
          event_location: d.location || d.eventLocation,
          event_date: d.date || d.eventDate,
          tickets_quantity: d.numberOfPeople || d.tickets || '1',
          ticket_type: d.eventType || 'general'
        });
      error = e;
      break;
    }
    case 'Custom Trips': {
      const { error: e } = await supabase
        .from('custom_trip_bookings')
        .insert({
          booking_id: bookingId,
          duration: d.duration,
          regions: d.regions,
          interests: d.interests || [],
          budget_range: d.budget || null,
          additional_info: d.additionalInfo || null
        });
      error = e;
      break;
    }
  }

  if (error) {
    console.error('Error inserting booking details:', error);
  }
}

// Update booking status with validation (for admin use)
export const updateBookingStatus = async (
  bookingId: string,
  newStatus: string,
  paymentStatus?: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'User must be authenticated' };
  }

  // Get current booking status for validation
  const { data: currentBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('status, service_type')
    .eq('id', bookingId)
    .single();

  if (fetchError || !currentBooking) {
    return { success: false, error: 'Booking not found' };
  }

  // Build update data
  const updateData: Record<string, unknown> = { 
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  if (paymentStatus) updateData.payment_status = paymentStatus;
  if (adminNotes) updateData.admin_notes = adminNotes;

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
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

// Complete draft booking by deleting it
export const completeDraftBooking = async (draftId: string): Promise<void> => {
  await deleteDraftBooking(draftId);
};

// Admin: Set price for booking (Accommodation/Events)
export const setBookingPrice = async (
  bookingId: string,
  price: number,
  adminNotes?: string
): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({
      total_price: price,
      admin_notes: adminNotes,
      payment_status: 'awaiting_payment' // Price set, waiting for customer payment
    })
    .eq('id', bookingId);

  if (error) throw error;
};

// Admin: Confirm booking (for cash payments)
export const confirmBooking = async (bookingId: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed'
    })
    .eq('id', bookingId);

  if (error) throw error;
};

// Admin: Activate booking (assign driver) - moves to DRIVER_ASSIGNED
export const assignDriverToBooking = async (bookingId: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'assigned'
    })
    .eq('id', bookingId);

  if (error) throw error;
};

// Admin: Mark booking as in progress - moves to IN_PROGRESS
export const activateBooking = async (bookingId: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'on_trip'
    })
    .eq('id', bookingId);

  if (error) throw error;
};

// Admin: Complete booking
export const completeBooking = async (bookingId: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'completed',
      payment_status: 'paid'
    })
    .eq('id', bookingId);

  if (error) throw error;
};

// Admin: Cancel booking
export const cancelBooking = async (bookingId: string, reason?: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      admin_notes: reason
    })
    .eq('id', bookingId);

  if (error) throw error;
};
