/**
 * BOOKING PRICE SERVICE
 * 
 * THIS SERVICE IS DEPRECATED - Use paymentGuardService.ts instead
 * 
 * SINGLE SOURCE OF TRUTH: booking_prices table (via v_booking_payment_guard view)
 * 
 * For setting prices: Use setBookingPrice from adminService.ts (calls Edge Function)
 * For checking payment eligibility: Use canPayForBooking from paymentGuardService.ts
 */

import { 
  canPayForBooking,
  getPaymentGuard,
  getPayableAmount,
  getMultiplePaymentGuards,
  type PaymentGuardData
} from './paymentGuardService';

// Re-export new service functions for backward compatibility
export { canPayForBooking, getPaymentGuard, getPayableAmount, getMultiplePaymentGuards };

export interface BookingPrice {
  booking_id: string;
  proposed_price: number;
  approved_price: number | null;
  currency: string;
  status: string;
  locked: boolean;
}

/**
 * @deprecated Use getPaymentGuard from paymentGuardService.ts
 */
export async function getPriceWorkflow(bookingId: string) {
  return getPaymentGuard(bookingId);
}

/**
 * @deprecated Use canPayForBooking from paymentGuardService.ts
 */
export async function canCustomerPay(bookingId: string): Promise<{ canPay: boolean; reason?: string; amount?: number }> {
  const result = await canPayForBooking(bookingId);
  return {
    canPay: result.canPay,
    reason: result.reason,
    amount: result.amount ?? undefined
  };
}

/**
 * Check if admin can edit price - price is editable if not locked
 */
export async function canAdminEditPrice(bookingId: string): Promise<boolean> {
  const guard = await getPaymentGuard(bookingId);
  if (!guard) return true; // No price set, can create
  return !guard.locked;
}

/**
 * Get the admin-set price for a booking
 * @deprecated Use getPaymentGuard from paymentGuardService.ts
 */
export async function getBookingPrice(bookingId: string): Promise<BookingPrice | null> {
  const guard = await getPaymentGuard(bookingId);
  if (!guard) return null;
  
  return {
    booking_id: guard.booking_id,
    proposed_price: guard.approved_price ?? 0,
    approved_price: guard.approved_price,
    currency: 'USD',
    status: guard.can_pay ? 'approved' : 'pending',
    locked: guard.locked
  };
}

/**
 * Check if a booking has an approved price
 */
export async function hasAdminPrice(bookingId: string): Promise<boolean> {
  const guard = await getPaymentGuard(bookingId);
  return guard !== null && guard.approved_price !== null && guard.approved_price > 0 && guard.locked;
}

/**
 * @deprecated Use setBookingPrice from adminService.ts via Edge Function
 */
export async function setBookingPrice(
  bookingId: string,
  price: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  console.warn('DEPRECATED: bookingPriceService.setBookingPrice is deprecated. Use adminService.setBookingPrice');
  return { 
    success: false, 
    error: 'Use setBookingPrice from adminService.ts which calls the admin-bookings Edge Function' 
  };
}

/**
 * Get prices for multiple bookings at once
 * @deprecated Use getMultiplePaymentGuards from paymentGuardService.ts
 */
export async function getBookingPrices(bookingIds: string[]): Promise<Record<string, BookingPrice>> {
  const guards = await getMultiplePaymentGuards(bookingIds);
  
  const priceMap: Record<string, BookingPrice> = {};
  for (const [bookingId, guard] of Object.entries(guards)) {
    priceMap[bookingId] = {
      booking_id: guard.booking_id,
      proposed_price: guard.approved_price ?? 0,
      approved_price: guard.approved_price,
      currency: 'USD',
      status: guard.can_pay ? 'approved' : 'pending',
      locked: guard.locked
    };
  }

  return priceMap;
}
