/**
 * USER-BOOKINGS EDGE FUNCTION
 * 
 * Provides secure access to a user's own bookings.
 * Users can ONLY see and manage their own bookings.
 * 
 * Uses shared auth middleware for consistent security.
 * 
 * Endpoints:
 * GET  /user-bookings              - List user's bookings
 * GET  /user-bookings/:id          - Get specific booking (if owned)
 * POST /user-bookings/:id/cancel   - Cancel own booking
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext,
  AuthContext
} from '../_shared/auth.ts'
import { canCancel } from '../_shared/booking-status.ts'

// ALIGNED WITH DATABASE ENUM - statuses that can be cancelled by user
const CANCELLABLE_STATUSES = ['draft', 'pending', 'under_review', 'approved', 'awaiting_payment']

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require authentication (any role)
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId, supabaseAdmin } = authResult as AuthContext

    // Parse URL - handle both direct calls and Supabase edge function routing
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    
    // Find the function name in the path and extract segments after it
    const functionIndex = pathParts.findIndex(p => p === 'user-bookings')
    const bookingId = functionIndex >= 0 && pathParts.length > functionIndex + 1 
      ? pathParts[functionIndex + 1] 
      : null
    const action = functionIndex >= 0 && pathParts.length > functionIndex + 2 
      ? pathParts[functionIndex + 2] 
      : null

    // =========================================================
    // GET /user-bookings - List user's bookings
    // =========================================================
    if (method === 'GET' && !bookingId) {
      const status = url.searchParams.get('status')
      const limit = parseInt(url.searchParams.get('limit') || '50')

      let query = supabaseAdmin
        .from('bookings')
        .select(`
          id,
          service_type,
          status,
          payment_status,
          total_price,
          admin_final_price,
          currency,
          created_at,
          updated_at,
          user_info,
          service_details,
          customer_notes,
          assigned_driver_id,
          assigned_guide_id,
          show_driver_to_customer
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: bookings, error } = await query

      if (error) {
        console.error('Error fetching bookings:', error)
        throw error
      }

      // Optionally fetch driver info for bookings with assigned drivers
      const bookingsWithDriverInfo = await Promise.all(
        (bookings || []).map(async (booking) => {
          if (booking.assigned_driver_id && booking.show_driver_to_customer) {
            const { data: driver } = await supabaseAdmin
              .from('drivers')
              .select('full_name, phone')
              .eq('id', booking.assigned_driver_id)
              .single()

            return { ...booking, driver_info: driver }
          }
          return booking
        })
      )

      return jsonResponse({
        success: true,
        bookings: bookingsWithDriverInfo,
        count: bookingsWithDriverInfo.length
      })
    }

    // =========================================================
    // GET /user-bookings/:id - Get specific booking
    // =========================================================
    if (method === 'GET' && bookingId && !action) {
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('user_id', userId) // CRITICAL: Ensure user owns this booking
        .maybeSingle()

      if (error) throw error
      if (!booking) {
        return errorResponse('Booking not found', 404)
      }

      // Fetch driver info if assigned and visible to customer
      if (booking.assigned_driver_id && booking.show_driver_to_customer) {
        const { data: driver } = await supabaseAdmin
          .from('drivers')
          .select('full_name, phone')
          .eq('id', booking.assigned_driver_id)
          .single()

        booking.driver_info = driver
      }

      // Fetch guide info if assigned
      if (booking.assigned_guide_id) {
        const { data: guide } = await supabaseAdmin
          .from('guides')
          .select('full_name, phone, languages, specialization')
          .eq('id', booking.assigned_guide_id)
          .single()

        booking.guide_info = guide
      }

      // Fetch status history
      const { data: statusHistory } = await supabaseAdmin
        .from('booking_status_history')
        .select('old_status, new_status, created_at, notes')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(10)

      return jsonResponse({
        success: true,
        booking,
        status_history: statusHistory || []
      })
    }

    // =========================================================
    // POST /user-bookings/:id/cancel - Cancel own booking
    // =========================================================
    if (method === 'POST' && bookingId && action === 'cancel') {
      const body = await req.json().catch(() => ({}))
      const reason = body.reason || 'Cancelled by customer'

      // Fetch booking and verify ownership
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('id, status, user_id')
        .eq('id', bookingId)
        .eq('user_id', userId) // CRITICAL: Ensure user owns this booking
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!booking) {
        return errorResponse('Booking not found', 404)
      }

      // Check if booking can be cancelled
      if (!canCancel(booking.status)) {
        return errorResponse(
          `Cannot cancel booking in '${booking.status}' status. Contact support for assistance.`,
          400
        )
      }

      // Update booking status
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'cancelled',
          customer_notes: `${booking.customer_notes || ''}\n[Cancelled: ${reason}]`.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log the activity (fire and forget)
      supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'booking_cancelled',
        activity_data: { booking_id: bookingId, reason },
        activity_description: 'Cancelled booking'
      }).catch(console.error)

      return jsonResponse({
        success: true,
        message: 'Booking cancelled successfully',
        status: 'cancelled'
      })
    }

    return errorResponse('Not found', 404)

  } catch (error: any) {
    console.error('User bookings error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
