/**
 * CONFIRM-BOOKING EDGE FUNCTION
 * 
 * User confirms booking after admin sets price
 * 
 * STRICT RULES:
 * 1. EVERY code path MUST return a Response
 * 2. Function only validates, saves, returns status
 * 3. NO navigation/redirect logic
 * 4. All errors wrapped in try/catch
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
  // Handle CORS preflight - ALWAYS return response
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // Wrap ENTIRE function in try/catch
  try {
    // Require authentication
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId, supabaseAdmin } = authResult as AuthContext
    
    // Validate user_id exists
    if (!userId) {
      return errorResponse('User authentication required', 401)
    }
    
    // Parse URL (support both direct calls and /functions/v1/<fn>/<id> routing)
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method

    const fnIndex = pathParts.findIndex((p) => p === 'confirm-booking')
    const bookingId = fnIndex >= 0 && pathParts.length > fnIndex + 1
      ? pathParts[fnIndex + 1]
      : null

    // =========================================================
    // POST /confirm-booking/:id - Confirm booking price
    // =========================================================
    if (method === 'POST') {
      // Validate booking ID is provided
      if (!bookingId) {
        return errorResponse('Booking ID is required', 400)
      }
      
      // Validate booking ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(bookingId)) {
        return errorResponse('Invalid booking ID format', 400)
      }

      // Fetch booking and verify ownership
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('id, status, user_id, service_type')
        .eq('id', bookingId)
        .eq('user_id', userId) // CRITICAL: Ensure user owns this booking
        .maybeSingle()

      if (fetchError) {
        console.error('Booking fetch error:', fetchError)
        return errorResponse('Failed to fetch booking', 500)
      }
      
      if (!booking) {
        return errorResponse('Booking not found or access denied', 404)
      }

      // Check status - must be awaiting_payment or approved
      const confirmableStatuses = ['awaiting_payment', 'approved']
      if (!confirmableStatuses.includes(booking.status)) {
        return errorResponse(
          `Cannot confirm booking in '${booking.status}' status. Booking must be in 'awaiting_payment' or 'approved' status.`,
          400
        )
      }

      // Verify price is set and locked in booking_prices
      const { data: priceData, error: priceError } = await supabaseAdmin
        .from('booking_prices')
        .select('admin_price, locked, currency')
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (priceError) {
        console.error('Price fetch error:', priceError)
        return errorResponse('Failed to fetch price data', 500)
      }
      
      if (!priceData) {
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

      if (updateError) {
        console.error('Booking update error:', updateError)
        return errorResponse('Failed to confirm booking', 500)
      }

      // Record status change
      try {
        await supabaseAdmin.from('booking_status_history').insert({
          booking_id: bookingId,
          old_status: booking.status,
          new_status: newStatus,
          changed_by: userId,
          notes: 'Customer confirmed booking price'
        })
      } catch (historyError) {
        console.warn('Failed to record status history:', historyError)
      }

      // Log user activity
      try {
        await supabaseAdmin.from('user_activities').insert({
          user_id: userId,
          activity_type: 'booking_confirmed',
          activity_data: { booking_id: bookingId, price: priceData.admin_price },
          activity_description: `Confirmed booking price: ${priceData.currency} ${priceData.admin_price}`
        })
      } catch (activityError) {
        console.warn('Failed to log activity:', activityError)
      }

      // SUCCESS RESPONSE
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

    // GET requests - return booking status
    if (method === 'GET') {
      if (!bookingId) {
        return errorResponse('Booking ID is required', 400)
      }
      
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select('id, status, payment_status')
        .eq('id', bookingId)
        .eq('user_id', userId)
        .maybeSingle()
      
      if (error || !booking) {
        return errorResponse('Booking not found', 404)
      }
      
      return jsonResponse({
        success: true,
        booking_id: booking.id,
        status: booking.status,
        payment_status: booking.payment_status
      })
    }

    // Method not allowed - ALWAYS return response
    return errorResponse('Method not allowed', 405)

  } catch (error: any) {
    // CATCH ALL unexpected errors - NEVER crash or return undefined
    console.error('Confirm booking error:', error)
    return errorResponse(
      error.message || 'Internal server error. Please try again.',
      500
    )
  }
})
