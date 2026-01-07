import { supabase } from '@/integrations/supabase/client';

/**
 * BOOKING PRICE SERVICE
 * 
 * booking_prices.admin_price is the ONLY payable price in the system.
 * This service handles all price-related operations.
 */

export interface BookingPrice {
  booking_id: string;
  admin_price: number;
  currency: string;
  created_at: string;
}

/**
 * Get the admin-set price for a booking
 * Returns null if no price has been set
 */
export async function getBookingPrice(bookingId: string): Promise<BookingPrice | null> {
  const { data, error } = await supabase
    .from('booking_prices')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching booking price:', error);
    return null;
  }

  return data;
}

/**
 * Check if a booking has an admin-set price
 */
export async function hasAdminPrice(bookingId: string): Promise<boolean> {
  const price = await getBookingPrice(bookingId);
  return price !== null && price.admin_price > 0;
}

/**
 * Get the payable amount for a booking
 * Returns 0 if no price has been set
 */
export async function getPayableAmount(bookingId: string): Promise<number> {
  const price = await getBookingPrice(bookingId);
  return price?.admin_price || 0;
}

/**
 * Set the admin price for a booking (admin only)
 * This will upsert into booking_prices table
 */
export async function setBookingPrice(
  bookingId: string,
  price: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('booking_prices')
      .upsert({
        booking_id: bookingId,
        admin_price: price,
        currency: currency
      }, {
        onConflict: 'booking_id'
      });

    if (error) {
      console.error('Error setting booking price:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get prices for multiple bookings at once
 */
export async function getBookingPrices(bookingIds: string[]): Promise<Record<string, BookingPrice>> {
  if (bookingIds.length === 0) return {};

  const { data, error } = await supabase
    .from('booking_prices')
    .select('*')
    .in('booking_id', bookingIds);

  if (error) {
    console.error('Error fetching booking prices:', error);
    return {};
  }

  const priceMap: Record<string, BookingPrice> = {};
  for (const price of data || []) {
    priceMap[price.booking_id] = price;
  }

  return priceMap;
}
