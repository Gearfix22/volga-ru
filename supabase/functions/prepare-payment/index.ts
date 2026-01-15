/**
 * PREPARE-PAYMENT EDGE FUNCTION
 * 
 * Prepares payment data for the booking
 * Returns the exact amount to pay (from booking_prices.admin_price)
 * 
 * Mobile-compatible, API-first design
 * NO REDIRECTS - returns data for mobile payment flow
 * 
 * GET /prepare-payment/:id - Get payment details for booking
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
    // GET /prepare-payment/:id - Get payment details
    // =========================================================
    if (method === 'GET' && bookingId) {
      // Fetch booking and verify ownership
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('id, status, user_id, service_type, payment_status, currency')
        .eq('id', bookingId)
        .eq('user_id', userId) // CRITICAL: Ensure user owns this booking
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      // Check if already paid
      if (booking.payment_status === 'paid') {
        return errorResponse('Booking is already paid', 400)
      }

      // CRITICAL: Fetch price from booking_prices (SINGLE SOURCE OF TRUTH)
      const { data: priceData, error: priceError } = await supabaseAdmin
        .from('booking_prices')
        .select('admin_price, locked, currency, tax')
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (priceError || !priceData) {
        return errorResponse('Price data not found. Please contact support.', 500)
      }

      // Validate price is set and locked
      if (priceData.admin_price === null || priceData.admin_price <= 0) {
        return jsonResponse({
          success: false,
          can_pay: false,
          reason: 'Price has not been set by admin yet.',
          booking_status: booking.status
        })
      }

      if (priceData.locked !== true) {
        return jsonResponse({
          success: false,
          can_pay: false,
          reason: 'Price is not finalized. Please wait for admin confirmation.',
          booking_status: booking.status
        })
      }

      // Valid statuses for payment
      const payableStatuses = ['awaiting_customer_confirmation', 'awaiting_payment']
      if (!payableStatuses.includes(booking.status)) {
        return jsonResponse({
          success: false,
          can_pay: false,
          reason: `Cannot pay for booking in '${booking.status}' status.`,
          booking_status: booking.status
        })
      }

      // Calculate total with tax
      const subtotal = priceData.admin_price
      const tax = priceData.tax || 0
      const total = subtotal + tax

      return jsonResponse({
        success: true,
        can_pay: true,
        booking_id: bookingId,
        service_type: booking.service_type,
        payment: {
          subtotal: subtotal,
          tax: tax,
          total: total,
          currency: priceData.currency || booking.currency || 'USD'
        },
        // Available payment methods (mobile-compatible)
        payment_methods: [
          {
            id: 'bank_transfer',
            label: 'Bank Transfer',
            description: 'Upload receipt after transfer',
            requires_verification: true
          },
          {
            id: 'cash',
            label: 'Cash on Service',
            description: 'Pay in person',
            requires_verification: true
          }
        ],
        message: 'Payment prepared successfully'
      })
    }

    return errorResponse('Booking ID required', 400)

  } catch (error: any) {
    console.error('Prepare payment error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
