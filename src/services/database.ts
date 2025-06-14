
import { supabase } from '@/lib/supabase';
import { BookingData } from '@/types/booking';

export interface DatabaseBooking {
  id?: string;
  user_id?: string;
  service_type: string;
  service_details: any;
  user_info: any;
  total_price?: number;
  payment_method?: string;
  transaction_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const createBooking = async (bookingData: BookingData, paymentDetails: {
  paymentMethod: string;
  transactionId: string;
  totalPrice: number;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const booking: DatabaseBooking = {
    user_id: user?.id,
    service_type: bookingData.serviceType,
    service_details: bookingData.serviceDetails,
    user_info: bookingData.userInfo,
    total_price: paymentDetails.totalPrice,
    payment_method: paymentDetails.paymentMethod,
    transaction_id: paymentDetails.transactionId,
    status: 'completed'
  };

  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return data;
};

export const getUserBookings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return data;
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }

  return data;
};

export const createUserProfile = async (profileData: {
  id: string;
  full_name: string;
  phone?: string;
  preferred_language?: string;
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return data;
};
