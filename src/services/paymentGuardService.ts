/**
 * Payment Guard Service
 * 
 * SINGLE SOURCE OF TRUTH: v_booking_payment_guard view
 * This view reads from booking_prices table
 * 
 * This service reads from the database view to determine:
 * - can_pay: Whether customer can pay (admin_price IS NOT NULL AND locked = true)
 * - approved_price: The locked approved amount (from booking_prices.admin_price)
 * - locked: Whether price is locked
 * 
 * ARCHITECTURE:
 * booking_prices.admin_price → v_booking_payment_guard.approved_price
 * booking_prices.locked → v_booking_payment_guard.locked
 * (locked = true AND admin_price IS NOT NULL) → v_booking_payment_guard.can_pay
 */

import { supabase } from '@/integrations/supabase/client';

export interface PaymentGuardData {
  booking_id: string;
  can_pay: boolean;
  approved_price: number | null;
  locked: boolean;
}

/**
 * Get payment eligibility from v_booking_payment_guard view
 * This is the ONLY source of truth for payment eligibility
 */
export async function getPaymentGuard(bookingId: string): Promise<PaymentGuardData | null> {
  const { data, error } = await supabase
    .from('v_booking_payment_guard')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching payment guard:', error);
    return null;
  }

  return data as PaymentGuardData | null;
}

/**
 * Check if customer can pay for a booking
 * Uses v_booking_payment_guard.can_pay as source of truth
 */
export async function canPayForBooking(bookingId: string): Promise<{
  canPay: boolean;
  amount: number | null;
  reason?: string;
}> {
  const guard = await getPaymentGuard(bookingId);

  if (!guard) {
    // No price record exists - admin hasn't set a price yet
    return { canPay: false, amount: null, reason: 'Price not set by admin' };
  }

  if (!guard.approved_price || guard.approved_price <= 0) {
    return { canPay: false, amount: null, reason: 'No approved price set by admin' };
  }

  if (!guard.locked) {
    return { canPay: false, amount: guard.approved_price, reason: 'Price must be locked by admin before payment' };
  }

  if (!guard.can_pay) {
    return { canPay: false, amount: guard.approved_price, reason: 'Payment not available - contact admin' };
  }

  return {
    canPay: true,
    amount: guard.approved_price
  };
}

/**
 * Get payment guards for multiple bookings
 */
export async function getMultiplePaymentGuards(bookingIds: string[]): Promise<Record<string, PaymentGuardData>> {
  if (bookingIds.length === 0) return {};

  const { data, error } = await supabase
    .from('v_booking_payment_guard')
    .select('*')
    .in('booking_id', bookingIds);

  if (error) {
    console.error('Error fetching payment guards:', error);
    return {};
  }

  const map: Record<string, PaymentGuardData> = {};
  for (const guard of data || []) {
    if (guard.booking_id) {
      map[guard.booking_id] = guard as PaymentGuardData;
    }
  }

  return map;
}

/**
 * Subscribe to payment guard changes for real-time updates
 * Listens to booking_prices table changes (the source of truth)
 */
export function subscribeToPaymentGuardChanges(
  bookingId: string,
  callback: (data: PaymentGuardData | null) => void
): () => void {
  // Subscribe to booking_prices changes (SINGLE SOURCE OF TRUTH)
  const channel = supabase
    .channel(`payment-guard-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'booking_prices',
        filter: `booking_id=eq.${bookingId}`
      },
      async () => {
        // Refetch from view after change
        const guard = await getPaymentGuard(bookingId);
        callback(guard);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get the payable amount for a booking
 * Returns the approved_price only if payment is allowed
 */
export async function getPayableAmount(bookingId: string): Promise<number | null> {
  const result = await canPayForBooking(bookingId);
  return result.canPay ? result.amount : null;
}
