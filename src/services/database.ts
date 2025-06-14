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
      throw bookingError;
    }

    // Insert service-specific details with enhanced data
    if (bookingData.serviceType === 'Transportation' && 'pickup' in bookingData.serviceDetails) {
      const details = bookingData.serviceDetails;
      const { error: transportError } = await supabase
        .from('transportation_bookings')
        .insert({
          booking_id: booking.id,
          pickup_location: details.pickup,
          dropoff_location: details.dropoff,
          travel_date: details.date,
          travel_time: details.time,
          vehicle_type: details.vehicleType,
          passengers: details.passengers || '1'
        });

      if (transportError) {
        console.error('Error creating transportation booking:', transportError);
      }
    }

    if (bookingData.serviceType === 'Hotels' && 'city' in bookingData.serviceDetails) {
      const details = bookingData.serviceDetails;
      const { error: hotelError } = await supabase
        .from('hotel_bookings')
        .insert({
          booking_id: booking.id,
          city: details.city,
          hotel_name: details.hotel || 'To be determined',
          checkin_date: details.checkin,
          checkout_date: details.checkout,
          room_type: details.roomType,
          guests: details.guests || '1',
          special_requests: details.specialRequests || null
        });

      if (hotelError) {
        console.error('Error creating hotel booking:', hotelError);
      }
    }

    if (bookingData.serviceType === 'Events' && 'eventName' in bookingData.serviceDetails) {
      const details = bookingData.serviceDetails;
      const { error: eventError } = await supabase
        .from('event_bookings')
        .insert({
          booking_id: booking.id,
          event_name: details.eventName,
          event_location: details.eventLocation,
          event_date: details.eventDate,
          tickets_quantity: details.tickets,
          ticket_type: details.ticketType || 'general'
        });

      if (eventError) {
        console.error('Error creating event booking:', eventError);
      }
    }

    if (bookingData.serviceType === 'Custom Trips' && 'duration' in bookingData.serviceDetails) {
      const details = bookingData.serviceDetails;
      const { error: tripError } = await supabase
        .from('custom_trip_bookings')
        .insert({
          booking_id: booking.id,
          duration: details.duration,
          regions: details.regions,
          interests: details.interests || [],
          budget_range: details.budget || null,
          additional_info: details.additionalInfo || null
        });

      if (tripError) {
        console.error('Error creating custom trip booking:', tripError);
      }
    }

    console.log('Enhanced booking created successfully:', booking);
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
