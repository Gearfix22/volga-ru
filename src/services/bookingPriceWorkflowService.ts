/**
 * DEPRECATED: BOOKING PRICE WORKFLOW SERVICE
 * 
 * This service is DEPRECATED. Use paymentGuardService.ts instead.
 * 
 * SINGLE SOURCE OF TRUTH: booking_prices table (via v_booking_payment_guard view)
 * 
 * The booking_price_workflow table is deprecated and should not be used for new code.
 * All price operations go through the admin-bookings Edge Function which writes to booking_prices.
 * 
 * For payment eligibility: use canPayForBooking from paymentGuardService.ts
 * For setting prices: use setBookingPrice from adminService.ts
 */

import { 
  canPayForBooking as _canPayForBooking,
  getPaymentGuard,
  getPayableAmount as _getPayableAmount,
  type PaymentGuardData
} from './paymentGuardService';

// Re-export for backward compatibility
export { getPaymentGuard, type PaymentGuardData };

export interface PriceWorkflow {
  id: string;
  booking_id: string;
  proposed_price: number;
  approved_price: number | null;
  currency: string;
  status: 'pending' | 'proposed' | 'approved' | 'paid';
  locked: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * @deprecated Use getPaymentGuard from paymentGuardService.ts
 */
export async function getPriceWorkflow(bookingId: string): Promise<PriceWorkflow | null> {
  console.warn('DEPRECATED: getPriceWorkflow is deprecated. Use getPaymentGuard from paymentGuardService.ts');
  const guard = await getPaymentGuard(bookingId);
  if (!guard) return null;
  
  // Transform to legacy format for backward compatibility
  return {
    id: bookingId,
    booking_id: bookingId,
    proposed_price: guard.approved_price ?? 0,
    approved_price: guard.approved_price,
    currency: 'USD',
    status: guard.can_pay ? 'approved' : 'pending',
    locked: guard.locked,
    approved_by: null,
    approved_at: null,
    created_at: null,
    updated_at: null
  };
}

/**
 * @deprecated Use setBookingPrice from adminService.ts via Edge Function
 */
export async function createPriceWorkflow(
  bookingId: string,
  proposedPrice: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  console.warn('DEPRECATED: createPriceWorkflow is deprecated. Use setBookingPrice from adminService.ts');
  return { success: false, error: 'Use setBookingPrice from adminService.ts via admin-bookings Edge Function' };
}

/**
 * @deprecated Use setBookingPrice from adminService.ts via Edge Function
 */
export async function setProposedPrice(
  bookingId: string,
  price: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  console.warn('DEPRECATED: setProposedPrice is deprecated. Use setBookingPrice from adminService.ts');
  return { success: false, error: 'Use setBookingPrice from adminService.ts via admin-bookings Edge Function' };
}

/**
 * @deprecated Use setBookingPrice from adminService.ts via Edge Function with lock: true
 */
export async function approvePrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  console.warn('DEPRECATED: approvePrice is deprecated. Use setBookingPrice from adminService.ts');
  return { success: false, error: 'Use setBookingPrice from adminService.ts via admin-bookings Edge Function' };
}

/**
 * Check if customer can pay - redirects to paymentGuardService
 */
export async function canCustomerPay(bookingId: string): Promise<{ canPay: boolean; reason?: string; amount?: number }> {
  const result = await _canPayForBooking(bookingId);
  return {
    canPay: result.canPay,
    reason: result.reason,
    amount: result.amount ?? undefined
  };
}

/**
 * Get the payable amount - redirects to paymentGuardService
 */
export async function getPayableAmount(bookingId: string): Promise<number> {
  return await _getPayableAmount(bookingId) ?? 0;
}

/**
 * @deprecated Mark as paid should be done via admin-bookings Edge Function
 */
export async function markPricePaid(bookingId: string): Promise<{ success: boolean; error?: string }> {
  console.warn('DEPRECATED: markPricePaid is deprecated. Use updatePaymentStatus from adminService.ts');
  return { success: false, error: 'Use updatePaymentStatus from adminService.ts' };
}

/**
 * @deprecated Use getMultiplePaymentGuards from paymentGuardService.ts
 */
export async function getMultiplePriceWorkflows(bookingIds: string[]): Promise<Record<string, PriceWorkflow>> {
  console.warn('DEPRECATED: getMultiplePriceWorkflows is deprecated. Use getMultiplePaymentGuards from paymentGuardService.ts');
  return {};
}

/**
 * Check if admin can edit price
 */
export async function canAdminEditPrice(bookingId: string): Promise<boolean> {
  const guard = await getPaymentGuard(bookingId);
  if (!guard) return true; // No price set yet
  return !guard.locked;
}
