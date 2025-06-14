
import { supabase } from '@/lib/supabase';
import { BookingData } from '@/types/booking';

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
    // Insert main booking record
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
      throw bookingError;
    }

    // Insert service-specific details based on service type
    if (bookingData.serviceType === 'Transportation' && 'pickup' in bookingData.serviceDetails) {
      const { error: transportError } = await supabase
        .from('transportation_bookings')
        .insert({
          booking_id: booking.id,
          pickup_location: bookingData.serviceDetails.pickup,
          dropoff_location: bookingData.serviceDetails.dropoff,
          travel_date: bookingData.serviceDetails.date,
          travel_time: bookingData.serviceDetails.time,
          vehicle_type: bookingData.serviceDetails.vehicleType
        });

      if (transportError) {
        console.error('Error creating transportation booking:', transportError);
      }
    }

    if (bookingData.serviceType === 'Hotels' && 'city' in bookingData.serviceDetails) {
      const { error: hotelError } = await supabase
        .from('hotel_bookings')
        .insert({
          booking_id: booking.id,
          city: bookingData.serviceDetails.city,
          hotel_name: bookingData.serviceDetails.hotel,
          checkin_date: bookingData.serviceDetails.checkin,
          checkout_date: bookingData.serviceDetails.checkout,
          room_type: bookingData.serviceDetails.roomType
        });

      if (hotelError) {
        console.error('Error creating hotel booking:', hotelError);
      }
    }

    if (bookingData.serviceType === 'Events' && 'eventName' in bookingData.serviceDetails) {
      const { error: eventError } = await supabase
        .from('event_bookings')
        .insert({
          booking_id: booking.id,
          event_name: bookingData.serviceDetails.eventName,
          event_location: bookingData.serviceDetails.eventLocation,
          event_date: bookingData.serviceDetails.eventDate,
          tickets_quantity: bookingData.serviceDetails.tickets
        });

      if (eventError) {
        console.error('Error creating event booking:', eventError);
      }
    }

    if (bookingData.serviceType === 'Custom Trips' && 'duration' in bookingData.serviceDetails) {
      const { error: tripError } = await supabase
        .from('custom_trip_bookings')
        .insert({
          booking_id: booking.id,
          duration: bookingData.serviceDetails.duration,
          regions: bookingData.serviceDetails.regions,
          interests: bookingData.serviceDetails.interests || []
        });

      if (tripError) {
        console.error('Error creating custom trip booking:', tripError);
      }
    }

    console.log('Booking created successfully:', booking);
    return booking;

  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
};

export const getUserBookings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to view bookings');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      transportation_bookings(*),
      hotel_bookings(*),
      event_bookings(*),
      custom_trip_bookings(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }

  return data;
};

export const getBookingById = async (bookingId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to view booking details');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      transportation_bookings(*),
      hotel_bookings(*),
      event_bookings(*),
      custom_trip_bookings(*)
    `)
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }

  return data;
};
