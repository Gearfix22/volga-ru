/**
 * Payment Guard Service
 * 
 * SINGLE SOURCE OF TRUTH: v_booking_payment_guard view
 * 
 * This service reads from the database view to determine:
 * - can_pay: Whether customer can pay
 * - approved_price: The locked approved amount
 * - locked: Whether price is locked
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
    return { canPay: false, amount: null, reason: 'Price not set by admin' };
  }

  if (!guard.can_pay) {
    if (!guard.locked) {
      return { canPay: false, amount: null, reason: 'Price must be approved and locked' };
    }
    if (!guard.approved_price) {
      return { canPay: false, amount: null, reason: 'No approved price set' };
    }
    return { canPay: false, amount: null, reason: 'Payment not available' };
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
 */
export function subscribeToPaymentGuardChanges(
  bookingId: string,
  callback: (data: PaymentGuardData | null) => void
): () => void {
  // Subscribe to booking_price_workflow changes
  const channel = supabase
    .channel(`payment-guard-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'booking_price_workflow',
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
