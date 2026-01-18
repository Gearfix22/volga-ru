/**
 * PROCESS-PAYMENT EDGE FUNCTION
 * 
 * UNIFIED payment processing for ALL payment methods
 * This is the SINGLE entry point for customer payments
 * 
 * CRITICAL: This function normalizes payment handling across:
 * - Cash on Arrival
 * - Credit Card
 * - Bank Transfer
 * 
 * WORKFLOW:
 * 1. Validate booking ownership and eligibility
 * 2. Verify price from booking_prices (SINGLE SOURCE OF TRUTH)
 * 3. Process payment based on method
 * 4. Update booking status consistently
 * 5. Create audit trail
 * 
 * POST /process-payment - Process payment for a booking
 * Body: { booking_id, payment_method, transaction_id?, receipt_url?, customer_notes? }
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext,
  AuthContext
} from '../_shared/auth.ts'

// Valid payment methods
const VALID_PAYMENT_METHODS = ['cash', 'credit_card', 'bank_transfer'] as const
type PaymentMethod = typeof VALID_PAYMENT_METHODS[number]

// Statuses that allow payment processing
const PAYABLE_STATUSES = ['awaiting_payment', 'approved']

interface ProcessPaymentRequest {
  booking_id: string
  payment_method: PaymentMethod
  transaction_id?: string
  receipt_url?: string
  customer_notes?: string
  payment_currency?: string
  exchange_rate?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405)
    }

    // Require authentication
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId, supabaseAdmin } = authResult as AuthContext

    // Parse request body
    const body: ProcessPaymentRequest = await req.json()
    const { 
      booking_id, 
      payment_method, 
      transaction_id, 
      receipt_url, 
      customer_notes,
      payment_currency,
      exchange_rate 
    } = body

    // =========================================================
    // VALIDATION PHASE
    // =========================================================

    // Validate required fields
    if (!booking_id) {
      return errorResponse('booking_id is required', 400)
    }

    if (!payment_method || !VALID_PAYMENT_METHODS.includes(payment_method)) {
      return errorResponse(`payment_method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`, 400)
    }

    // Fetch booking and verify ownership
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, payment_status, user_id, service_type, currency')
      .eq('id', booking_id)
      .eq('user_id', userId) // CRITICAL: Ensure user owns this booking
      .maybeSingle()

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError)
      return errorResponse('Booking not found or access denied', 404)
    }

    // Check if already paid
    if (booking.payment_status === 'paid') {
      return errorResponse('Booking is already paid', 400, 'ALREADY_PAID')
    }

    // Verify booking status allows payment
    if (!PAYABLE_STATUSES.includes(booking.status)) {
      return errorResponse(
        `Cannot process payment for booking in '${booking.status}' status. ` +
        `Booking must be in one of: ${PAYABLE_STATUSES.join(', ')}`,
        400,
        'INVALID_STATUS'
      )
    }

    // =========================================================
    // PRICE VERIFICATION (SINGLE SOURCE OF TRUTH)
    // =========================================================

    // Fetch price from booking_prices table
    const { data: priceData, error: priceError } = await supabaseAdmin
      .from('booking_prices')
      .select('admin_price, locked, currency, tax')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (priceError || !priceData) {
      console.error('Price fetch error:', priceError)
      return errorResponse('Price data not found. Admin must set price first.', 400, 'NO_PRICE')
    }

    // Validate price is set and locked
    if (priceData.admin_price === null || priceData.admin_price <= 0) {
      return errorResponse('Admin has not set the price yet. Please wait.', 400, 'PRICE_NOT_SET')
    }

    if (!priceData.locked) {
      return errorResponse('Price is not locked. Admin must confirm the price first.', 400, 'PRICE_NOT_LOCKED')
    }

    // Calculate total with tax
    const subtotal = priceData.admin_price
    const tax = priceData.tax || 0
    const totalAmount = subtotal + tax
    const finalCurrency = priceData.currency || booking.currency || 'USD'

    // =========================================================
    // PROCESS PAYMENT BY METHOD
    // =========================================================

    let newPaymentStatus: string
    let newBookingStatus: string
    let requiresVerification = false
    let paymentMessage: string

    switch (payment_method) {
      case 'cash':
        // Cash on Arrival - booking is confirmed, payment pending on delivery
        newPaymentStatus = 'pending'
        newBookingStatus = 'confirmed' // Confirmed but not paid yet
        paymentMessage = 'Cash payment registered. Please pay on service delivery.'
        break

      case 'credit_card':
        // Credit Card - immediate payment confirmation
        // NOTE: In production, integrate with Stripe/payment gateway
        newPaymentStatus = 'paid'
        newBookingStatus = 'paid'
        paymentMessage = 'Credit card payment processed successfully.'
        break

      case 'bank_transfer':
        // Bank Transfer - requires admin verification
        requiresVerification = true
        newPaymentStatus = 'pending_verification'
        newBookingStatus = 'awaiting_payment' // Stay in awaiting_payment until verified
        paymentMessage = 'Bank transfer submitted. Awaiting admin verification.'
        break

      default:
        return errorResponse('Invalid payment method', 400)
    }

    // Generate transaction ID if not provided
    const finalTransactionId = transaction_id || `${payment_method.toUpperCase()}-${Date.now()}-${booking_id.slice(0, 8)}`

    // =========================================================
    // UPDATE DATABASE
    // =========================================================

    // Update booking with payment information
    const updateData: Record<string, any> = {
      payment_method: payment_method,
      payment_status: newPaymentStatus,
      status: newBookingStatus,
      transaction_id: finalTransactionId,
      requires_verification: requiresVerification,
      payment_currency: payment_currency || finalCurrency,
      exchange_rate_used: exchange_rate || 1,
      final_paid_amount: totalAmount,
      updated_at: new Date().toISOString()
    }

    if (customer_notes) {
      updateData.customer_notes = customer_notes
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', booking_id)

    if (updateError) {
      console.error('Booking update error:', updateError)
      return errorResponse('Failed to process payment', 500)
    }

    // Record status change in history
    await supabaseAdmin.from('booking_status_history').insert({
      booking_id: booking_id,
      old_status: booking.status,
      new_status: newBookingStatus,
      changed_by: userId,
      notes: `Payment submitted via ${payment_method}. Transaction: ${finalTransactionId}`
    })

    // Save receipt if provided (for bank transfer)
    if (receipt_url && payment_method === 'bank_transfer') {
      await supabaseAdmin.from('payment_receipts').insert({
        booking_id: booking_id,
        file_url: receipt_url,
        file_name: `receipt_${finalTransactionId}`,
        upload_date: new Date().toISOString()
      })
    }

    // Log user activity
    await supabaseAdmin.from('user_activities').insert({
      user_id: userId,
      activity_type: 'payment_submitted',
      activity_data: { 
        booking_id, 
        payment_method, 
        amount: totalAmount,
        currency: finalCurrency,
        transaction_id: finalTransactionId
      },
      activity_description: `Submitted ${payment_method} payment of ${totalAmount} ${finalCurrency}`
    })

    // Notify admins
    await supabaseAdmin.from('unified_notifications').insert({
      recipient_type: 'admin',
      recipient_id: '00000000-0000-0000-0000-000000000000',
      type: 'payment_submitted',
      title: 'Payment Submitted',
      message: `${payment_method} payment of ${totalAmount} ${finalCurrency} submitted for booking. ${requiresVerification ? 'Requires verification.' : ''}`,
      booking_id: booking_id
    })

    // =========================================================
    // RESPONSE
    // =========================================================

    return jsonResponse({
      success: true,
      booking_id,
      payment: {
        method: payment_method,
        transaction_id: finalTransactionId,
        amount: totalAmount,
        currency: finalCurrency,
        status: newPaymentStatus,
        requires_verification: requiresVerification
      },
      booking_status: newBookingStatus,
      message: paymentMessage
    })

  } catch (error: any) {
    console.error('Process payment error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
