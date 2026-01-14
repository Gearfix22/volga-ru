/**
 * ADMIN-BOOKINGS EDGE FUNCTION
 * 
 * Full CRUD operations for bookings - ADMIN ONLY
 * Uses shared auth middleware for consistent security
 * 
 * Endpoints:
 * GET    /admin-bookings              - List all bookings
 * GET    /admin-bookings/:id          - Get specific booking
 * PUT    /admin-bookings/:id          - Update booking
 * DELETE /admin-bookings/:id          - Delete booking
 * POST   /admin-bookings/:id/set-price      - Set price and move to awaiting_customer_confirmation
 * POST   /admin-bookings/:id/confirm        - Confirm booking (legacy)
 * POST   /admin-bookings/:id/reject         - Reject booking
 * POST   /admin-bookings/:id/payment        - Update payment status
 * POST   /admin-bookings/:id/assign-driver  - Assign driver
 * POST   /admin-bookings/:id/assign-guide   - Assign guide
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  requireAdmin,
  logAdminAction,
  AuthContext
} from '../_shared/auth.ts'
import {
  isValidTransition,
  getValidNextStatuses,
  PRICE_EDITABLE_STATUSES,
  canCancel,
  FINAL_STATUSES
} from '../_shared/booking-status.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require admin role
    const authResult = await requireAdmin(req)
    if (authResult instanceof Response) return authResult
    
    const { user, supabaseAdmin } = authResult as AuthContext
    
    // Parse URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const bookingId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // =========================================================
    // GET /admin-bookings - List all bookings
    // =========================================================
    if (method === 'GET' && !bookingId) {
      const status = url.searchParams.get('status')
      const paymentStatus = url.searchParams.get('payment_status')

      let query = supabaseAdmin
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') query = query.eq('status', status)
      if (paymentStatus && paymentStatus !== 'all') query = query.eq('payment_status', paymentStatus)

      const { data, error } = await query
      if (error) throw error

      return jsonResponse({ bookings: data })
    }

    // =========================================================
    // GET /admin-bookings/:id - Get specific booking
    // =========================================================
    if (method === 'GET' && bookingId && !action) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return errorResponse('Booking not found', 404)
      }

      return jsonResponse({ booking: data })
    }

    // =========================================================
    // POST /admin-bookings/:id/set-price
    // =========================================================
    if (method === 'POST' && bookingId && action === 'set-price') {
      const body = await req.json()
      const { price, admin_notes, currency } = body

      if (typeof price !== 'number' || price <= 0) {
        return errorResponse('Valid price is required', 400)
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, admin_final_price, user_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      // Validate status allows price editing
      if (!PRICE_EDITABLE_STATUSES.includes(booking.status)) {
        return errorResponse(
          `Cannot set price for booking in '${booking.status}' status`,
          400,
          'PRICE_LOCKED'
        )
      }

      // Upsert into booking_prices table
      const { error: priceError } = await supabaseAdmin
        .from('booking_prices')
        .upsert({
          booking_id: bookingId,
          admin_price: price,
          currency: currency || 'USD'
        }, {
          onConflict: 'booking_id'
        })

      if (priceError) {
        console.error('Error setting booking price:', priceError)
        return errorResponse('Failed to set price', 500)
      }

      // Update bookings table
      const updateData: Record<string, any> = {
        admin_final_price: price,
        status: 'awaiting_customer_confirmation',
        updated_at: new Date().toISOString()
      }
      if (admin_notes) updateData.admin_notes = admin_notes

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) throw updateError

      await logAdminAction(supabaseAdmin, user.id, 'price_set', bookingId, 'bookings', {
        price,
        old_status: booking.status,
        new_status: 'awaiting_customer_confirmation'
      })

      // Notify customer
      if (booking.user_id) {
        await supabaseAdmin.from('customer_notifications').insert({
          user_id: booking.user_id,
          booking_id: bookingId,
          type: 'price_set',
          title: 'Price Confirmed',
          message: `Your booking price has been set to $${price}. Please confirm and proceed to payment.`
        })
      }

      return jsonResponse({ success: true, price, status: 'awaiting_customer_confirmation' })
    }

    // =========================================================
    // POST /admin-bookings/:id/confirm
    // =========================================================
    if (method === 'POST' && bookingId && action === 'confirm') {
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      const oldStatus = booking.status
      const newStatus = 'under_review'

      if (!isValidTransition(oldStatus, newStatus) && oldStatus !== 'pending') {
        return errorResponse(
          `Cannot confirm booking in '${oldStatus}' status`,
          400,
          'INVALID_TRANSITION'
        )
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      if (updateError) throw updateError

      await logAdminAction(supabaseAdmin, user.id, 'booking_status_changed', bookingId, 'bookings', {
        old_status: oldStatus,
        new_status: newStatus
      })

      return jsonResponse({ success: true, status: newStatus })
    }

    // =========================================================
    // POST /admin-bookings/:id/reject
    // =========================================================
    if (method === 'POST' && bookingId && action === 'reject') {
      const body = await req.json()
      const reason = body.reason || 'No reason provided'

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, user_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      if (FINAL_STATUSES.includes(booking.status)) {
        return errorResponse(`Cannot reject booking in '${booking.status}' status`, 400)
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'rejected',
          admin_notes: `Rejected: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Notify customer
      if (booking.user_id) {
        await supabaseAdmin.from('customer_notifications').insert({
          user_id: booking.user_id,
          booking_id: bookingId,
          type: 'booking_rejected',
          title: 'Booking Rejected',
          message: `Your booking has been rejected. Reason: ${reason}`
        })
      }

      await logAdminAction(supabaseAdmin, user.id, 'booking_rejected', bookingId, 'bookings', {
        old_status: booking.status,
        reason
      })

      return jsonResponse({ success: true, status: 'rejected' })
    }

    // =========================================================
    // PUT /admin-bookings/:id - Update booking
    // =========================================================
    if (method === 'PUT' && bookingId && !action) {
      const body = await req.json()
      const { status, payment_status, admin_notes, admin_final_price, assigned_driver_id, assigned_guide_id } = body

      const { data: currentBooking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, payment_status, admin_final_price')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !currentBooking) {
        return errorResponse('Booking not found', 404)
      }

      // Validate status transition
      if (status && status !== currentBooking.status) {
        if (!isValidTransition(currentBooking.status, status)) {
          return errorResponse(
            `Invalid status transition from '${currentBooking.status}' to '${status}'`,
            400,
            'INVALID_TRANSITION'
          )
        }
      }

      // Block price updates after payment
      const lockedStatuses = ['paid', 'in_progress', 'completed']
      if (admin_final_price !== undefined && lockedStatuses.includes(currentBooking.status)) {
        return errorResponse('Cannot update price after payment', 400, 'PRICE_LOCKED')
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (status) updateData.status = status
      if (payment_status) updateData.payment_status = payment_status
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes
      if (admin_final_price !== undefined) updateData.admin_final_price = admin_final_price
      if (assigned_driver_id !== undefined) updateData.assigned_driver_id = assigned_driver_id
      if (assigned_guide_id !== undefined) updateData.assigned_guide_id = assigned_guide_id

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) throw updateError

      await logAdminAction(supabaseAdmin, user.id, status ? 'booking_status_changed' : 'booking_updated', bookingId, 'bookings', {
        ...updateData,
        old_status: currentBooking.status
      })

      return jsonResponse({ success: true, booking: { ...currentBooking, ...updateData } })
    }

    // =========================================================
    // POST /admin-bookings/:id/payment
    // =========================================================
    if (method === 'POST' && bookingId && action === 'payment') {
      const body = await req.json()
      const { payment_status } = body

      if (!payment_status) {
        return errorResponse('payment_status is required', 400)
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ payment_status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      if (updateError) throw updateError

      await logAdminAction(supabaseAdmin, user.id, 'payment_status_updated', bookingId, 'bookings', { payment_status })

      return jsonResponse({ success: true, payment_status })
    }

    // =========================================================
    // POST /admin-bookings/:id/assign-driver
    // =========================================================
    if (method === 'POST' && bookingId && action === 'assign-driver') {
      const body = await req.json()
      const { driver_id } = body

      if (driver_id) {
        const { data: driver, error: driverError } = await supabaseAdmin
          .from('drivers')
          .select('id, full_name, status')
          .eq('id', driver_id)
          .maybeSingle()

        if (driverError || !driver) {
          return errorResponse('Driver not found', 404)
        }

        if (driver.status !== 'active') {
          return errorResponse('Driver is not available', 400)
        }
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('assigned_driver_id, status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      const updateData: Record<string, any> = {
        assigned_driver_id: driver_id,
        driver_response: driver_id ? 'pending' : null,
        updated_at: new Date().toISOString()
      }

      // Auto-move to in_progress if paid and driver assigned
      if (driver_id && booking.status === 'paid') {
        updateData.status = 'in_progress'
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Notify driver
      if (driver_id) {
        await supabaseAdmin.from('driver_notifications').insert({
          driver_id,
          booking_id: bookingId,
          type: 'new_assignment',
          title: 'New Booking Assignment',
          message: 'You have been assigned to a new booking.'
        })
      }

      await logAdminAction(supabaseAdmin, user.id, 'driver_assigned', bookingId, 'bookings', {
        old_driver_id: booking.assigned_driver_id,
        new_driver_id: driver_id
      })

      return jsonResponse({ success: true, driver_id })
    }

    // =========================================================
    // POST /admin-bookings/:id/assign-guide
    // =========================================================
    if (method === 'POST' && bookingId && action === 'assign-guide') {
      const body = await req.json()
      const { guide_id } = body

      if (guide_id) {
        const { data: guide, error: guideError } = await supabaseAdmin
          .from('guides')
          .select('id, full_name, status')
          .eq('id', guide_id)
          .maybeSingle()

        if (guideError || !guide) {
          return errorResponse('Guide not found', 404)
        }

        if (guide.status !== 'active') {
          return errorResponse('Guide is not available', 400)
        }
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('assigned_guide_id, status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      const updateData: Record<string, any> = {
        assigned_guide_id: guide_id,
        updated_at: new Date().toISOString()
      }

      // Auto-move to in_progress if paid and guide assigned
      if (guide_id && booking.status === 'paid') {
        updateData.status = 'in_progress'
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Notify guide
      if (guide_id) {
        await supabaseAdmin.from('guide_notifications').insert({
          guide_id,
          booking_id: bookingId,
          type: 'new_assignment',
          title: 'New Booking Assignment',
          message: 'You have been assigned to a new booking.'
        })
      }

      await logAdminAction(supabaseAdmin, user.id, 'guide_assigned', bookingId, 'bookings', {
        old_guide_id: booking.assigned_guide_id,
        new_guide_id: guide_id
      })

      return jsonResponse({ success: true, guide_id })
    }

    // =========================================================
    // DELETE /admin-bookings/:id
    // =========================================================
    if (method === 'DELETE' && bookingId && !action) {
      // Delete related records first (cascade)
      const relatedTables = [
        'transportation_bookings',
        'hotel_bookings',
        'event_bookings',
        'custom_trip_bookings',
        'tourist_guide_bookings',
        'booking_status_history',
        'payment_receipts',
        'customer_notifications',
        'driver_notifications',
        'guide_notifications',
        'notifications'
      ]

      for (const table of relatedTables) {
        await supabaseAdmin.from(table).delete().eq('booking_id', bookingId)
      }

      const { error } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      await logAdminAction(supabaseAdmin, user.id, 'booking_deleted', bookingId, 'bookings', {})

      return jsonResponse({ success: true })
    }

    return errorResponse('Not found', 404)

  } catch (error: any) {
    console.error('Admin bookings error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
