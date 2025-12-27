import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './adminService';

export interface PriceNegotiationData {
  bookingId: string;
  adminPrice: number | null;
  customerProposedPrice: number | null;
  priceConfirmed: boolean;
  priceConfirmedAt: string | null;
}

// Admin sets price for a booking
export async function setAdminPrice(bookingId: string, price: number): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update({
      total_price: price,
      original_price_usd: price,
      price_confirmed: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error setting admin price:', error);
    return false;
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

  return true;
}

// Customer proposes a different price
export async function proposePrice(bookingId: string, proposedPrice: number): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update({
      customer_proposed_price: proposedPrice,
      price_confirmed: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error proposing price:', error);
    return false;
  }

  // Notify admin about counter-proposal
  await supabase.from('notifications').insert({
    type: 'price_proposal',
    message: `Customer proposed $${proposedPrice} for booking ${bookingId.substring(0, 8)}`,
    booking_id: bookingId,
    target_admin_id: null
  });

  return true;
}

// Customer confirms the price
export async function confirmPrice(bookingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update({
      price_confirmed: true,
      price_confirmed_at: new Date().toISOString(),
      customer_proposed_price: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error confirming price:', error);
    return false;
  }

  // Notify admin
  await supabase.from('notifications').insert({
    type: 'price_confirmed',
    message: `Customer confirmed price for booking ${bookingId.substring(0, 8)}`,
    booking_id: bookingId,
    target_admin_id: null
  });

  return true;
}

// Get price negotiation status
export async function getPriceNegotiationStatus(bookingId: string): Promise<PriceNegotiationData | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, total_price, customer_proposed_price, price_confirmed, price_confirmed_at')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching price status:', error);
    return null;
  }

  return {
    bookingId: data.id,
    adminPrice: data.total_price,
    customerProposedPrice: data.customer_proposed_price,
    priceConfirmed: data.price_confirmed || false,
    priceConfirmedAt: data.price_confirmed_at
  };
}

// Admin accepts customer's proposed price
export async function acceptProposedPrice(bookingId: string): Promise<boolean> {
  // Get the proposed price first
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('customer_proposed_price, user_id, service_type')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking?.customer_proposed_price) {
    console.error('Error fetching booking:', fetchError);
    return false;
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      total_price: booking.customer_proposed_price,
      original_price_usd: booking.customer_proposed_price,
      customer_proposed_price: null,
      price_confirmed: true,
      price_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error accepting proposed price:', error);
    return false;
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

  return true;
}

// Admin rejects customer's proposed price and sets new price
export async function rejectProposedPrice(bookingId: string, newPrice: number): Promise<boolean> {
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
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error rejecting proposed price:', error);
    return false;
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

  return true;
}
