import { supabase } from '@/integrations/supabase/client';
import { logAdminAction, setBookingPrice as adminSetBookingPrice } from './adminService';
import { getPaymentGuard, canPayForBooking } from './paymentGuardService';

export interface PriceNegotiationData {
  bookingId: string;
  proposedPrice: number | null;
  approvedPrice: number | null;
  customerProposedPrice: number | null;
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
  
  // Get customer proposed price from bookings table (negotiation feature)
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('customer_proposed_price, payment_status')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
  }

  return {
    bookingId,
    proposedPrice: guard?.approved_price || null,
    approvedPrice: guard?.approved_price || null,
    customerProposedPrice: booking?.customer_proposed_price || null,
    priceApproved: guard?.can_pay === true,
    priceLocked: guard?.locked || false,
    status: guard?.can_pay ? 'approved' : 'pending',
    approvedAt: null, // Not tracked in booking_prices
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
 * Customer proposes a different price (BEFORE approval only)
 */
export async function proposePrice(bookingId: string, proposedPrice: number): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if booking belongs to user
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id, status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.user_id !== user.id) {
    return { success: false, error: 'Not authorized' };
  }

  // Check if price is locked (using v_booking_payment_guard)
  const guard = await getPaymentGuard(bookingId);
  if (guard?.locked) {
    return { success: false, error: 'Cannot negotiate price after approval' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      customer_proposed_price: proposedPrice,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error proposing price:', error);
    return { success: false, error: error.message };
  }

  // Notify admin
  await supabase.from('notifications').insert({
    type: 'price_proposal',
    message: `Customer proposed $${proposedPrice} for booking ${bookingId.substring(0, 8)}`,
    booking_id: bookingId,
    target_admin_id: null
  });

  return { success: true };
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

  const { error } = await supabase
    .from('bookings')
    .update({
      price_confirmed: true,
      price_confirmed_at: new Date().toISOString(),
      customer_proposed_price: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error confirming price:', error);
    return { success: false, error: error.message };
  }

  // Notify admin
  await supabase.from('notifications').insert({
    type: 'price_confirmed',
    message: `Customer confirmed price for booking ${bookingId.substring(0, 8)}`,
    booking_id: bookingId,
    target_admin_id: null
  });

  return { success: true };
}

/**
 * Admin accepts customer's proposed price
 */
export async function acceptProposedPrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('customer_proposed_price, user_id, service_type')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking?.customer_proposed_price) {
    return { success: false, error: 'No proposed price found' };
  }

  // Set the proposed price as the new price and approve it via Edge Function
  try {
    const result = await adminSetBookingPrice(bookingId, booking.customer_proposed_price, { lock: true });
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to set price' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  // Clear customer proposed price
  await supabase
    .from('bookings')
    .update({
      customer_proposed_price: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  await logAdminAction('price_proposal_accepted', bookingId, 'bookings', { 
    acceptedPrice: booking.customer_proposed_price 
  });

  // Notify customer
  if (booking.user_id) {
    await supabase.from('customer_notifications').insert({
      user_id: booking.user_id,
      booking_id: bookingId,
      type: 'price_accepted',
      title: 'Price Proposal Accepted',
      message: `Your proposed price of $${booking.customer_proposed_price} has been accepted. You can now proceed with payment.`
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
    .select('customer_proposed_price, user_id, service_type')
    .eq('id', bookingId)
    .single();

  // Set the new proposed price (not locked - for negotiation)
  try {
    const result = await adminSetBookingPrice(bookingId, newPrice, { lock: false });
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to set price' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  // Clear customer proposed price
  await supabase
    .from('bookings')
    .update({
      customer_proposed_price: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  await logAdminAction('price_proposal_rejected', bookingId, 'bookings', { 
    rejectedPrice: booking?.customer_proposed_price,
    newPrice 
  });

  // Notify customer
  if (booking?.user_id) {
    await supabase.from('customer_notifications').insert({
      user_id: booking.user_id,
      booking_id: bookingId,
      type: 'price_updated',
      title: 'Price Counter-Offer',
      message: `Your proposed price was not accepted. The new price is $${newPrice}. Please review and respond.`
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

  if (priceData.status !== 'approved') {
    return { canPay: false, reason: 'Price must be approved' };
  }

  if (priceData.paymentStatus === 'paid') {
    return { canPay: false, reason: 'Already paid' };
  }

  return { canPay: true };
}
