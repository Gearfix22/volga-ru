import { supabase } from '@/integrations/supabase/client';

/**
 * BOOKING PRICE SERVICE
 * 
 * THIS SERVICE IS DEPRECATED - Use bookingPriceWorkflowService instead
 * 
 * Kept for backward compatibility during transition.
 * booking_price_workflow table is the SINGLE SOURCE OF TRUTH for pricing.
 */

// Re-export new service functions for gradual migration
export {
  getPriceWorkflow,
  canCustomerPay,
  getPayableAmount,
  canAdminEditPrice,
} from './bookingPriceWorkflowService';

export interface BookingPrice {
  booking_id: string;
  proposed_price: number;
  approved_price: number | null;
  currency: string;
  status: string;
  locked: boolean;
}

/**
 * Get the admin-set price for a booking from booking_price_workflow
 * @deprecated Use getPriceWorkflow from bookingPriceWorkflowService
 */
export async function getBookingPrice(bookingId: string): Promise<BookingPrice | null> {
  const { data, error } = await supabase
    .from('booking_price_workflow')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching booking price:', error);
    return null;
  }

  if (!data) return null;

  return {
    booking_id: data.booking_id,
    proposed_price: data.proposed_price,
    approved_price: data.approved_price,
    currency: data.currency,
    status: data.status,
    locked: data.locked
  };
}

/**
 * Check if a booking has an approved price
 */
export async function hasAdminPrice(bookingId: string): Promise<boolean> {
  const price = await getBookingPrice(bookingId);
  return price !== null && price.approved_price !== null && price.approved_price > 0 && price.locked;
}

/**
 * Set the admin price for a booking (admin only)
 * @deprecated Use setProposedPrice and approvePrice from bookingPriceWorkflowService
 */
export async function setBookingPrice(
  bookingId: string,
  price: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getBookingPrice(bookingId);
    
    if (existing) {
      if (existing.locked) {
        return { success: false, error: 'Price is locked and cannot be modified' };
      }
      
      const { error } = await supabase
        .from('booking_price_workflow')
        .update({
          proposed_price: price,
          currency: currency,
          status: 'proposed',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId);

      if (error) {
        console.error('Error setting booking price:', error);
        return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from('booking_price_workflow')
        .insert({
          booking_id: bookingId,
          proposed_price: price,
          currency: currency,
          status: 'proposed',
          locked: false
        });

      if (error) {
        console.error('Error creating booking price:', error);
        return { success: false, error: error.message };
      }
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
    .from('booking_price_workflow')
    .select('*')
    .in('booking_id', bookingIds);

  if (error) {
    console.error('Error fetching booking prices:', error);
    return {};
  }

  const priceMap: Record<string, BookingPrice> = {};
  for (const price of data || []) {
    priceMap[price.booking_id] = {
      booking_id: price.booking_id,
      proposed_price: price.proposed_price,
      approved_price: price.approved_price,
      currency: price.currency,
      status: price.status,
      locked: price.locked
    };
  }

  return priceMap;
}
