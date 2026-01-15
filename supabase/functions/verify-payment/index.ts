/**
 * VERIFY-PAYMENT EDGE FUNCTION
 * 
 * Handles payment verification for bookings
 * 
 * Mobile-compatible, API-first design
 * 
 * POST /verify-payment/:id - Submit payment for verification
 * POST /verify-payment/:id/confirm - Admin confirms payment (admin only)
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext,
  requireAdmin,
  logAdminAction,
  AuthContext
} from '../_shared/auth.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Parse URL first to determine if admin route
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const bookingId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // =========================================================
    // POST /verify-payment/:id/confirm - Admin confirms payment
    // =========================================================
    if (method === 'POST' && bookingId && action === 'confirm') {
      const authResult = await requireAdmin(req)
      if (authResult instanceof Response) return authResult
      
      const { user, supabaseAdmin } = authResult as AuthContext

      // Fetch booking
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('id, status, payment_status, user_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      if (booking.payment_status === 'paid') {
        return errorResponse('Payment already confirmed', 400)
      }

      // Get price data
      const { data: priceData } = await supabaseAdmin
        .from('booking_prices')
        .select('admin_price, currency')
        .eq('booking_id', bookingId)
        .maybeSingle()

      // Update booking
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'paid',
          final_paid_amount: priceData?.admin_price || 0,
          payment_currency: priceData?.currency || 'USD',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Record status change
      await supabaseAdmin.from('booking_status_history').insert({
        booking_id: bookingId,
        old_status: booking.status,
        new_status: 'paid',
        changed_by: user.id,
        notes: 'Payment verified by admin'
      })

      // Notify customer
      if (booking.user_id) {
        await supabaseAdmin.from('unified_notifications').insert({
          recipient_type: 'user',
          recipient_id: booking.user_id,
          type: 'payment_confirmed',
          title: 'Payment Confirmed',
          message: 'Your payment has been verified. Your booking is now confirmed!',
          booking_id: bookingId
        })
      }

      await logAdminAction(supabaseAdmin, user.id, 'payment_verified', bookingId, 'bookings', {
        amount: priceData?.admin_price,
        currency: priceData?.currency
      })

      return jsonResponse({
        success: true,
        status: 'paid',
        payment_status: 'paid',
        message: 'Payment confirmed successfully'
      })
    }

    // =========================================================
    // POST /verify-payment/:id - User submits payment
    // =========================================================
    if (method === 'POST' && bookingId && !action) {
      const authResult = await getAuthContext(req)
      if (authResult instanceof Response) return authResult
      
      const { userId, supabaseAdmin } = authResult as AuthContext

      // Fetch booking and verify ownership
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('id, status, user_id, payment_status')
        .eq('id', bookingId)
        .eq('user_id', userId) // CRITICAL: Ensure user owns this booking
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      if (booking.payment_status === 'paid') {
        return errorResponse('Booking is already paid', 400)
      }

      const body = await req.json()
      const { payment_method, transaction_id, receipt_url } = body

      if (!payment_method) {
        return errorResponse('Payment method is required', 400)
      }

      // Update booking with payment info
      const updateData: Record<string, any> = {
        payment_method,
        payment_status: payment_method === 'cash' ? 'pending' : 'pending_verification',
        updated_at: new Date().toISOString()
      }
      
      if (transaction_id) updateData.transaction_id = transaction_id
      if (payment_method !== 'cash') {
        updateData.requires_verification = true
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) throw updateError

      // If receipt provided, save it
      if (receipt_url) {
        await supabaseAdmin.from('payment_receipts').insert({
          booking_id: bookingId,
          file_url: receipt_url,
          file_name: `receipt_${bookingId}`,
          upload_date: new Date().toISOString()
        })
      }

      // Log activity
      await supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'payment_submitted',
        activity_data: { booking_id: bookingId, payment_method },
        activity_description: `Submitted ${payment_method} payment`
      })

      // Notify admins
      await supabaseAdmin.from('unified_notifications').insert({
        recipient_type: 'admin',
        recipient_id: '00000000-0000-0000-0000-000000000000',
        type: 'payment_submitted',
        title: 'Payment Submitted',
        message: `Payment submitted for booking. Method: ${payment_method}. Requires verification.`,
        booking_id: bookingId
      })

      return jsonResponse({
        success: true,
        payment_status: updateData.payment_status,
        message: payment_method === 'cash' 
          ? 'Cash payment registered. Please pay on service delivery.'
          : 'Payment submitted. Awaiting verification.'
      })
    }

    return errorResponse('Booking ID required', 400)

  } catch (error: any) {
    console.error('Verify payment error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
