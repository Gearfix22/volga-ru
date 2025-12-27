import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './adminService';

export interface PriceNegotiationData {
  bookingId: string;
  originalPrice: number | null;
  adminPrice: number | null;
  customerProposedPrice: number | null;
  priceConfirmed: boolean;
  priceConfirmedAt: string | null;
  paymentStatus: string | null;
}

/**
 * Admin sets/updates price for a booking
 * CRITICAL: This is the ONLY way to set prices - ensures persistence
 */
export async function setAdminPrice(bookingId: string, price: number): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate price
  if (price < 0) {
    return { success: false, error: 'Price cannot be negative' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      total_price: price,
      original_price_usd: price,
      price_confirmed: false,
      payment_status: 'awaiting_payment',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error setting admin price:', error);
    return { success: false, error: error.message };
  }

  // Log the action
  await logAdminAction('price_set', bookingId, 'bookings', { price });

  // Notify customer about price update
  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id, service_type')
    .eq('id', bookingId)
    .single();

  if (booking?.user_id) {
    await supabase.from('customer_notifications').insert({
      user_id: booking.user_id,
      booking_id: bookingId,
      type: 'price_update',
      title: 'Price Updated',
      message: `The price for your ${booking.service_type} booking has been set to $${price}. Please review and confirm.`
    });
  }

  return { success: true };
}

/**
 * Customer proposes a different price (BEFORE payment only)
 */
export async function proposePrice(bookingId: string, proposedPrice: number): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if booking belongs to user and is in valid state
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id, status, payment_status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.user_id !== user.id) {
    return { success: false, error: 'Not authorized' };
  }

  // Can only propose price before payment
  if (booking.payment_status === 'paid') {
    return { success: false, error: 'Cannot negotiate price after payment' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      customer_proposed_price: proposedPrice,
      price_confirmed: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .eq('user_id', user.id); // Security: ensure user owns this booking

  if (error) {
    console.error('Error proposing price:', error);
    return { success: false, error: error.message };
  }

  // Notify admin about counter-proposal
  await supabase.from('notifications').insert({
    type: 'price_proposal',
    message: `Customer proposed $${proposedPrice} for booking ${bookingId.substring(0, 8)}`,
    booking_id: bookingId,
    target_admin_id: null
  });

  return { success: true };
}

/**
 * Customer confirms the price (agrees to pay)
 */
export async function confirmPrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify booking ownership and price exists
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id, total_price')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.user_id !== user.id) {
    return { success: false, error: 'Not authorized' };
  }

  if (!booking.total_price || booking.total_price <= 0) {
    return { success: false, error: 'No price set by admin yet' };
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
 * Get complete price negotiation status
 */
export async function getPriceNegotiationStatus(bookingId: string): Promise<PriceNegotiationData | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, total_price, original_price_usd, customer_proposed_price, price_confirmed, price_confirmed_at, payment_status')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching price status:', error);
    return null;
  }

  return {
    bookingId: data.id,
    originalPrice: data.original_price_usd,
    adminPrice: data.total_price,
    customerProposedPrice: data.customer_proposed_price,
    priceConfirmed: data.price_confirmed || false,
    priceConfirmedAt: data.price_confirmed_at,
    paymentStatus: data.payment_status
  };
}

/**
 * Admin accepts customer's proposed price
 */
export async function acceptProposedPrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get the proposed price first
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('customer_proposed_price, user_id, service_type')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking?.customer_proposed_price) {
    return { success: false, error: 'No proposed price found' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      total_price: booking.customer_proposed_price,
      original_price_usd: booking.customer_proposed_price,
      customer_proposed_price: null,
      price_confirmed: true,
      price_confirmed_at: new Date().toISOString(),
      payment_status: 'awaiting_payment',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error accepting proposed price:', error);
    return { success: false, error: error.message };
  }

  // Log the action
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

  const { error } = await supabase
    .from('bookings')
    .update({
      total_price: newPrice,
      original_price_usd: newPrice,
      customer_proposed_price: null,
      price_confirmed: false,
      payment_status: 'awaiting_payment',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error rejecting proposed price:', error);
    return { success: false, error: error.message };
  }

  // Log the action
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
 * Check if customer can pay (price must be confirmed)
 */
export function canCustomerPay(priceData: PriceNegotiationData): { canPay: boolean; reason?: string } {
  if (!priceData.adminPrice || priceData.adminPrice <= 0) {
    return { canPay: false, reason: 'Price not set by admin' };
  }

  if (!priceData.priceConfirmed) {
    return { canPay: false, reason: 'Please confirm the price before payment' };
  }

  if (priceData.paymentStatus === 'paid') {
    return { canPay: false, reason: 'Already paid' };
  }

  return { canPay: true };
}
