import { supabase } from '@/integrations/supabase/client';
import { logAdminAction, setBookingPrice as adminSetBookingPrice } from './adminService';
import { getPaymentGuard } from './paymentGuardService';

export interface PriceNegotiationData {
  bookingId: string;
  proposedPrice: number | null;
  approvedPrice: number | null;
  priceApproved: boolean;
  priceLocked: boolean;
  status: string;
  approvedAt: string | null;
  paymentStatus: string | null;
}

/**
 * Get complete price negotiation status from v_booking_payment_guard (SINGLE SOURCE OF TRUTH)
 */
export async function getPriceNegotiationStatus(bookingId: string): Promise<PriceNegotiationData | null> {
  // Get from v_booking_payment_guard (single source of truth)
  const guard = await getPaymentGuard(bookingId);
  
  // Get payment status from bookings table
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('payment_status, status')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
  }

  return {
    bookingId,
    proposedPrice: guard?.approved_price || null,
    approvedPrice: guard?.approved_price || null,
    priceApproved: guard?.can_pay === true,
    priceLocked: guard?.locked || false,
    status: booking?.status || 'pending',
    approvedAt: null,
    paymentStatus: booking?.payment_status || null
  };
}

/**
 * Admin sets/updates price for a booking
 * CRITICAL: Uses adminService.setBookingPrice which calls the Edge Function
 */
export async function setAdminPrice(bookingId: string, price: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await adminSetBookingPrice(bookingId, price, { lock: false });
    return { success: result.success !== false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Admin approves and locks the price
 * CRITICAL: Uses adminService.setBookingPrice with lock: true
 */
export async function adminApprovePrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  // Get current price first
  const guard = await getPaymentGuard(bookingId);
  if (!guard?.approved_price) {
    return { success: false, error: 'No price set to approve' };
  }
  
  try {
    const result = await adminSetBookingPrice(bookingId, guard.approved_price, { lock: true });
    return { success: result.success !== false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Customer confirms the approved price
 */
export async function confirmPrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.user_id !== user.id) {
    return { success: false, error: 'Not authorized' };
  }

  // Check if price is approved and locked (using v_booking_payment_guard)
  const guard = await getPaymentGuard(bookingId);
  if (!guard || !guard.locked || !guard.can_pay) {
    return { success: false, error: 'Price must be approved by admin first' };
  }

  // Update booking status to indicate price acceptance
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'awaiting_payment',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error confirming price:', error);
    return { success: false, error: error.message };
  }

  // Notify admin via unified_notifications
  await supabase.from('unified_notifications').insert({
    recipient_type: 'admin',
    recipient_id: user.id, // Will be filtered by recipient_type
    type: 'price_confirmed',
    title: 'Price Confirmed',
    message: `Customer confirmed price for booking ${bookingId.substring(0, 8)}`,
    booking_id: bookingId
  });

  return { success: true };
}

/**
 * Admin accepts customer's proposed price (legacy - price negotiation is now via booking_prices)
 */
export async function acceptProposedPrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get booking to find user
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id, service_type, total_price')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Get current price from booking_prices
  const guard = await getPaymentGuard(bookingId);
  const priceToApprove = guard?.approved_price || booking?.total_price;

  if (!priceToApprove) {
    return { success: false, error: 'No price to approve' };
  }

  // Set the price and lock it via Edge Function
  try {
    const result = await adminSetBookingPrice(bookingId, priceToApprove, { lock: true });
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to set price' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  await logAdminAction('price_approved', bookingId, 'bookings', { 
    approvedPrice: priceToApprove 
  });

  // Notify customer via unified_notifications
  if (booking.user_id) {
    await supabase.from('unified_notifications').insert({
      recipient_id: booking.user_id,
      recipient_type: 'user',
      booking_id: bookingId,
      type: 'price_accepted',
      title: 'Price Approved',
      message: `Your booking price of $${priceToApprove} has been approved. You can now proceed with payment.`
    });
  }

  return { success: true };
}

/**
 * Admin rejects customer's proposed price and sets new price
 */
export async function rejectProposedPrice(bookingId: string, newPrice: number): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id, service_type, total_price')
    .eq('id', bookingId)
    .single();

  const oldPrice = booking?.total_price;

  // Set the new proposed price (not locked - for negotiation)
  try {
    const result = await adminSetBookingPrice(bookingId, newPrice, { lock: false });
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to set price' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  await logAdminAction('price_counter_offer', bookingId, 'bookings', { 
    oldPrice,
    newPrice 
  });

  // Notify customer via unified_notifications
  if (booking?.user_id) {
    await supabase.from('unified_notifications').insert({
      recipient_id: booking.user_id,
      recipient_type: 'user',
      booking_id: bookingId,
      type: 'price_updated',
      title: 'Price Counter-Offer',
      message: `A new price of $${newPrice} has been set for your booking. Please review and respond.`
    });
  }

  return { success: true };
}

/**
 * Check if customer can pay
 */
export function canCustomerPayCheck(priceData: PriceNegotiationData): { canPay: boolean; reason?: string } {
  if (!priceData.approvedPrice || priceData.approvedPrice <= 0) {
    return { canPay: false, reason: 'Price not approved by admin' };
  }

  if (!priceData.priceLocked) {
    return { canPay: false, reason: 'Price must be locked before payment' };
  }

  if (priceData.paymentStatus === 'paid') {
    return { canPay: false, reason: 'Already paid' };
  }

  return { canPay: true };
}
