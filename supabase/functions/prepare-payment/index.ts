/**
 * PREPARE-PAYMENT EDGE FUNCTION
 * 
 * Prepares payment data for the booking
 * Returns the exact amount to pay (from booking_prices.admin_price)
 * 
 * STRICT RULES:
 * 1. EVERY code path MUST return a Response
 * 2. Function only validates, fetches data, returns status
 * 3. NO navigation/redirect logic
 * 4. All errors wrapped in try/catch
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

    const fnIndex = pathParts.findIndex((p) => p === 'prepare-payment')
    const bookingId = fnIndex >= 0 && pathParts.length > fnIndex + 1
      ? pathParts[fnIndex + 1]
      : null

    // =========================================================
    // GET /prepare-payment/:id - Get payment details
    // =========================================================
    if (method === 'GET') {
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
        .select('id, status, user_id, service_type, payment_status, currency, service_details')
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

      // Check if already paid
      if (booking.payment_status === 'paid') {
        return jsonResponse({
          success: false,
          can_pay: false,
          reason: 'Booking is already paid',
          booking_status: booking.status
        })
      }

      // CRITICAL: Fetch price from booking_prices (SINGLE SOURCE OF TRUTH)
      const { data: priceData, error: priceError } = await supabaseAdmin
        .from('booking_prices')
        .select('admin_price, locked, currency, tax')
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (priceError) {
        console.error('Price fetch error:', priceError)
        return errorResponse('Failed to fetch price data', 500)
      }
      
      if (!priceData) {
        return jsonResponse({
          success: false,
          can_pay: false,
          reason: 'Price data not found. Please contact support.',
          booking_status: booking.status
        })
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
      const payableStatuses = ['awaiting_payment', 'approved']
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

      // Parse multi-service details if available
      let selectedServices: string[] = []
      const serviceDetails = booking.service_details as Record<string, any> | null
      
      if (serviceDetails?._multiService && serviceDetails?._selectedServices) {
        selectedServices = serviceDetails._selectedServices
      }

      // SUCCESS RESPONSE
      return jsonResponse({
        success: true,
        can_pay: true,
        booking_id: bookingId,
        service_type: booking.service_type,
        selected_services: selectedServices.length > 0 ? selectedServices : [booking.service_type],
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

    // Method not allowed - ALWAYS return response
    return errorResponse('Method not allowed', 405)

  } catch (error: any) {
    // CATCH ALL unexpected errors - NEVER crash or return undefined
    console.error('Prepare payment error:', error)
    return errorResponse(
      error.message || 'Internal server error. Please try again.',
      500
    )
  }
})
