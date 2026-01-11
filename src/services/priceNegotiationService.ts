import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './adminService';
import { getPriceWorkflow, setProposedPrice, approvePrice } from './bookingPriceWorkflowService';

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
 * Get complete price negotiation status from booking_price_workflow
 */
export async function getPriceNegotiationStatus(bookingId: string): Promise<PriceNegotiationData | null> {
  // Get from booking_price_workflow (single source of truth)
  const workflow = await getPriceWorkflow(bookingId);
  
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
    proposedPrice: workflow?.proposed_price || null,
    approvedPrice: workflow?.approved_price || null,
    customerProposedPrice: booking?.customer_proposed_price || null,
    priceApproved: workflow?.status === 'approved',
    priceLocked: workflow?.locked || false,
    status: workflow?.status || 'pending',
    approvedAt: workflow?.approved_at || null,
    paymentStatus: booking?.payment_status || null
  };
}

/**
 * Admin sets/updates price for a booking
 */
export async function setAdminPrice(bookingId: string, price: number): Promise<{ success: boolean; error?: string }> {
  return setProposedPrice(bookingId, price);
}

/**
 * Admin approves and locks the price
 */
export async function adminApprovePrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  return approvePrice(bookingId);
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

  // Check if price is locked
  const workflow = await getPriceWorkflow(bookingId);
  if (workflow?.locked) {
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

  // Check if price is approved and locked
  const workflow = await getPriceWorkflow(bookingId);
  if (!workflow || !workflow.locked || workflow.status !== 'approved') {
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

  // Set the proposed price as the new price and approve it
  const setResult = await setProposedPrice(bookingId, booking.customer_proposed_price);
  if (!setResult.success) {
    return setResult;
  }

  const approveResult = await approvePrice(bookingId);
  if (!approveResult.success) {
    return approveResult;
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

  // Set the new proposed price (not approved yet)
  const result = await setProposedPrice(bookingId, newPrice);
  if (!result.success) {
    return result;
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
