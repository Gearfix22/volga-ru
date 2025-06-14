
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

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  preferred_language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  price?: number;
  duration?: number;
  image_url?: string;
  features?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const createBooking = async (bookingData: BookingData, paymentDetails: {
  paymentMethod: string;
  transactionId: string;
  totalPrice: number;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a booking');
  }

  const booking: DatabaseBooking = {
    user_id: user.id,
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

export const createOrUpdateUserProfile = async (profileData: {
  full_name?: string;
  phone?: string;
  preferred_language?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Try to update first, if no rows affected, then insert
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id)
    .select()
    .single();

  if (updateError && updateError.code === 'PGRST116') {
    // No rows found, create new profile
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        ...profileData
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user profile:', insertError);
      throw insertError;
    }

    return insertData;
  } else if (updateError) {
    console.error('Error updating user profile:', updateError);
    throw updateError;
  }

  return updateData;
};

export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
};

export const getAvailableServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }

  return data;
};

export const getServicesByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }

  return data;
};
