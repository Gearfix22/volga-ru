
import { supabase } from '@/lib/supabase';
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

    // Insert main booking record with enhanced service details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        service_type: bookingData.serviceType,
        customer_name: bookingData.userInfo.fullName,
        customer_email: bookingData.userInfo.email,
        customer_phone: bookingData.userInfo.phone,
        customer_language: bookingData.userInfo.language,
        payment_method: paymentInfo.paymentMethod,
        transaction_id: paymentInfo.transactionId,
        payment_amount: paymentInfo.totalPrice,
        total_price: bookingData.totalPrice || paymentInfo.totalPrice,
        payment_status: 'completed',
        booking_status: 'confirmed',
        service_details: bookingData.serviceDetails
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

    // Track successful booking creation
    await trackFormInteraction('booking_creation', 'submitted', {
      serviceType: bookingData.serviceType,
      bookingId: booking.id,
      totalPrice: paymentInfo.totalPrice,
      paymentMethod: paymentInfo.paymentMethod
    });

    console.log('Enhanced booking created successfully:', booking);
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
