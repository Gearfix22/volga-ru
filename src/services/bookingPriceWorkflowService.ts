import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './adminService';

/**
 * BOOKING PRICE WORKFLOW SERVICE
 * 
 * SINGLE SOURCE OF TRUTH: booking_price_workflow table
 * 
 * Workflow:
 * 1. Admin sets proposed_price (locked = false)
 * 2. Admin can edit proposed_price while locked = false
 * 3. Admin approves → sets approved_price, locked = true
 * 4. Customer pays ONLY when status = 'approved' AND locked = true
 * 5. approved_price is the ONLY payable price
 */

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
 * Get price workflow for a booking
 */
export async function getPriceWorkflow(bookingId: string): Promise<PriceWorkflow | null> {
  const { data, error } = await supabase
    .from('booking_price_workflow')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching price workflow:', error);
    return null;
  }

  return data as PriceWorkflow | null;
}

/**
 * Create initial price workflow when booking is created
 */
export async function createPriceWorkflow(
  bookingId: string,
  proposedPrice: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('booking_price_workflow')
    .insert({
      booking_id: bookingId,
      proposed_price: proposedPrice,
      currency,
      status: 'pending',
      locked: false
    });

  if (error) {
    console.error('Error creating price workflow:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Admin sets/updates proposed price (ONLY when locked = false)
 */
export async function setProposedPrice(
  bookingId: string,
  price: number,
  currency: string = 'USD'
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (price < 0) {
    return { success: false, error: 'Price cannot be negative' };
  }

  // Check if workflow exists
  const existing = await getPriceWorkflow(bookingId);
  
  if (existing) {
    // Cannot edit if locked
    if (existing.locked) {
      return { success: false, error: 'Price is locked and cannot be modified' };
    }
    
    // Update existing
    const { error } = await supabase
      .from('booking_price_workflow')
      .update({
        proposed_price: price,
        currency,
        status: 'proposed',
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId);

    if (error) {
      console.error('Error updating proposed price:', error);
      return { success: false, error: error.message };
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('booking_price_workflow')
      .insert({
        booking_id: bookingId,
        proposed_price: price,
        currency,
        status: 'proposed',
        locked: false
      });

    if (error) {
      console.error('Error creating proposed price:', error);
      return { success: false, error: error.message };
    }
  }

  // Log admin action
  await logAdminAction('price_proposed', bookingId, 'booking_price_workflow', { price });

  // Notify customer
  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id, service_type')
    .eq('id', bookingId)
    .single();

  if (booking?.user_id) {
    await supabase.from('customer_notifications').insert({
      user_id: booking.user_id,
      booking_id: bookingId,
      type: 'price_proposed',
      title: 'Price Quote Available',
      message: `A price of $${price} has been proposed for your ${booking.service_type} booking. Please review.`
    });
  }

  return { success: true };
}

/**
 * Admin approves the price (sets approved_price, locked = true)
 */
export async function approvePrice(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const workflow = await getPriceWorkflow(bookingId);
  
  if (!workflow) {
    return { success: false, error: 'Price workflow not found' };
  }

  if (workflow.locked) {
    return { success: false, error: 'Price is already approved and locked' };
  }

  const { error } = await supabase
    .from('booking_price_workflow')
    .update({
      approved_price: workflow.proposed_price,
      status: 'approved',
      locked: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error approving price:', error);
    return { success: false, error: error.message };
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({
      status: 'awaiting_customer_confirmation',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  // Log admin action
  await logAdminAction('price_approved', bookingId, 'booking_price_workflow', { 
    approved_price: workflow.proposed_price 
  });

  // Notify customer
  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id, service_type')
    .eq('id', bookingId)
    .single();

  if (booking?.user_id) {
    await supabase.from('customer_notifications').insert({
      user_id: booking.user_id,
      booking_id: bookingId,
      type: 'price_approved',
      title: 'Price Confirmed - Ready for Payment',
      message: `Your booking price of $${workflow.proposed_price} has been confirmed. You can now proceed to payment.`
    });
  }

  return { success: true };
}

/**
 * Check if customer can pay
 * ONLY when status = 'approved' AND locked = true
 */
export async function canCustomerPay(bookingId: string): Promise<{ canPay: boolean; reason?: string; amount?: number }> {
  const workflow = await getPriceWorkflow(bookingId);
  
  if (!workflow) {
    return { canPay: false, reason: 'Price not set by admin' };
  }

  if (workflow.status === 'paid') {
    return { canPay: false, reason: 'Already paid' };
  }

  if (workflow.status !== 'approved') {
    return { canPay: false, reason: 'Price must be approved by admin first' };
  }

  if (!workflow.locked) {
    return { canPay: false, reason: 'Price is not locked' };
  }

  if (!workflow.approved_price || workflow.approved_price <= 0) {
    return { canPay: false, reason: 'No approved price set' };
  }

  return { 
    canPay: true, 
    amount: workflow.approved_price 
  };
}

/**
 * Get the payable amount (approved_price ONLY)
 */
export async function getPayableAmount(bookingId: string): Promise<number> {
  const workflow = await getPriceWorkflow(bookingId);
  
  if (!workflow || workflow.status !== 'approved' || !workflow.locked) {
    return 0;
  }
  
  return workflow.approved_price || 0;
}

/**
 * Mark price as paid (called after successful payment)
 */
export async function markPricePaid(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const workflow = await getPriceWorkflow(bookingId);
  
  if (!workflow) {
    return { success: false, error: 'Price workflow not found' };
  }

  if (!workflow.locked || workflow.status !== 'approved') {
    return { success: false, error: 'Cannot mark as paid - price not approved' };
  }

  const { error } = await supabase
    .from('booking_price_workflow')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error marking price as paid:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get prices for multiple bookings
 */
export async function getMultiplePriceWorkflows(bookingIds: string[]): Promise<Record<string, PriceWorkflow>> {
  if (bookingIds.length === 0) return {};

  const { data, error } = await supabase
    .from('booking_price_workflow')
    .select('*')
    .in('booking_id', bookingIds);

  if (error) {
    console.error('Error fetching price workflows:', error);
    return {};
  }

  const map: Record<string, PriceWorkflow> = {};
  for (const workflow of data || []) {
    map[workflow.booking_id] = workflow as PriceWorkflow;
  }

  return map;
}

/**
 * Check if admin can edit price (only when NOT locked)
 */
export async function canAdminEditPrice(bookingId: string): Promise<boolean> {
  const workflow = await getPriceWorkflow(bookingId);
  
  if (!workflow) return true; // Can create new
  return !workflow.locked;
}
