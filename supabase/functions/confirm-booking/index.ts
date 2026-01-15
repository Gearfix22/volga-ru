/**
 * CONFIRM-BOOKING EDGE FUNCTION
 * 
 * User confirms booking after admin sets price
 * This moves the booking to 'awaiting_payment' or directly triggers payment
 * 
 * Mobile-compatible, API-first design
 * 
 * WORKFLOW:
 * 1. Admin sets price (via admin-bookings/set-price) - price is locked
 * 2. Customer calls this endpoint to confirm
 * 3. Booking status changes to 'awaiting_payment' or 'paid'
 * 
 * POST /confirm-booking/:id - Confirm booking price
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext,
  AuthContext
} from '../_shared/auth.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require authentication
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId, supabaseAdmin } = authResult as AuthContext
    
    // Parse URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const bookingId = pathParts.length > 1 ? pathParts[1] : null

    // =========================================================
    // POST /confirm-booking/:id - Confirm booking price
    // =========================================================
    if (method === 'POST' && bookingId) {
      // Fetch booking and verify ownership
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('id, status, user_id, service_type')
        .eq('id', bookingId)
        .eq('user_id', userId) // CRITICAL: Ensure user owns this booking
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      // Check status - must be awaiting customer confirmation
      if (booking.status !== 'awaiting_customer_confirmation') {
        return errorResponse(
          `Cannot confirm booking in '${booking.status}' status. Booking must be in 'awaiting_customer_confirmation' status.`,
          400
        )
      }

      // Verify price is set and locked in booking_prices
      const { data: priceData, error: priceError } = await supabaseAdmin
        .from('booking_prices')
        .select('admin_price, locked, currency')
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (priceError || !priceData) {
        return errorResponse('Price data not found. Please contact support.', 500)
      }

      if (priceData.admin_price === null || priceData.admin_price <= 0) {
        return errorResponse('Price has not been set by admin yet.', 400)
      }

      if (priceData.locked !== true) {
        return errorResponse('Price is not locked. Please wait for admin to finalize.', 400)
      }

      // Update booking status to awaiting_payment
      const newStatus = 'awaiting_payment'
      
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Record status change
      await supabaseAdmin.from('booking_status_history').insert({
        booking_id: bookingId,
        old_status: booking.status,
        new_status: newStatus,
        changed_by: userId,
        notes: 'Customer confirmed booking price'
      })

      // Log user activity
      await supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'booking_confirmed',
        activity_data: { booking_id: bookingId, price: priceData.admin_price },
        activity_description: `Confirmed booking price: ${priceData.currency} ${priceData.admin_price}`
      })

      return jsonResponse({ 
        success: true, 
        status: newStatus,
        price: {
          amount: priceData.admin_price,
          currency: priceData.currency
        },
        message: 'Booking confirmed. Please proceed to payment.'
      })
    }

    return errorResponse('Booking ID required', 400)

  } catch (error: any) {
    console.error('Confirm booking error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
