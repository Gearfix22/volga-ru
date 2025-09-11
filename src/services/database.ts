
import { supabase } from '@/integrations/supabase/client';
import { BookingData } from '@/types/booking';
import { trackFormInteraction } from './dataTracking';

export interface PaymentInfo {
  paymentMethod: string;
  transactionId: string;
  totalPrice: number;
}

export const createBooking = async (bookingData: BookingData, paymentInfo: PaymentInfo) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a booking');
  }

  try {
    // Track booking creation attempt
    await trackFormInteraction('booking_creation', 'started', {
      serviceType: bookingData.serviceType,
      paymentMethod: paymentInfo.paymentMethod,
      totalPrice: paymentInfo.totalPrice
    });

    // Insert main booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        service_type: bookingData.serviceType,
        user_info: bookingData.userInfo as any,
        payment_method: paymentInfo.paymentMethod,
        transaction_id: paymentInfo.transactionId,
        total_price: bookingData.totalPrice || paymentInfo.totalPrice,
        status: 'confirmed',
        service_details: bookingData.serviceDetails as any
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      await trackFormInteraction('booking_creation', 'abandoned', {
        serviceType: bookingData.serviceType,
        error: bookingError.message
      });
      throw bookingError;
    }

    // Insert into the corresponding details table
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
      default:
        break;
    }
    if (detailError) {
      // If this fails, you may want to handle detail insert errors/log as needed
      console.error('Error inserting booking details:', detailError);
      // Optionally rollback the booking, or just log this error
    }

    // Track successful booking creation
    await trackFormInteraction('booking_creation', 'submitted', {
      serviceType: bookingData.serviceType,
      bookingId: booking.id,
      totalPrice: paymentInfo.totalPrice,
      paymentMethod: paymentInfo.paymentMethod
    });

    return booking;

  } catch (error) {
    console.error('Error in createBooking:', error);
    await trackFormInteraction('booking_creation', 'abandoned', {
      serviceType: bookingData.serviceType,
      error: error.message
    });
    throw error;
  }
};

export const getUserBookings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to view bookings');
  }

  try {
    // First, get the basic bookings without the problematic joins
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    // Return empty array instead of throwing to prevent dashboard crashes
    return [];
  }
};

export const getBookingById = async (bookingId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to view booking details');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }

  return data;
};

export const updateUserProfile = async (profileData: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to update profile');
  }

  // Update user metadata in Supabase Auth
  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: profileData.displayName,
      phone: profileData.phone,
      language: profileData.language,
      notifications: profileData.notifications
    }
  });

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return { success: true };
};

export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to get profile');
  }

  // Get user profile from profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return {
    ...user,
    profile: profile || null
  };
};
