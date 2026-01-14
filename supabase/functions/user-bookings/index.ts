import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * USER-BOOKINGS EDGE FUNCTION
 * 
 * Provides secure access to a user's own bookings.
 * Users can ONLY see and manage their own bookings.
 * 
 * Endpoints:
 * GET  /user-bookings              - List user's bookings
 * GET  /user-bookings/:id          - Get specific booking (if owned)
 * POST /user-bookings/:id/cancel   - Cancel own booking
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function errorResponse(error: string, status = 400) {
  return jsonResponse({ error, success: false }, status)
}

// Statuses that can be cancelled by user
const CANCELLABLE_STATUSES = ['draft', 'under_review', 'awaiting_customer_confirmation', 'pending']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    // Validate JWT and get user
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return errorResponse('Invalid or expired token', 401)
    }

    const userId = user.id
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Parse URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const bookingId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

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
      if (!CANCELLABLE_STATUSES.includes(booking.status)) {
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

      // Log the activity
      await supabaseAdmin.from('user_activities').insert({
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

  } catch (error) {
    console.error('User bookings error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
