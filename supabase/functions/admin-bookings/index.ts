/**
 * ADMIN-BOOKINGS EDGE FUNCTION
 * 
 * Full CRUD operations for bookings - ADMIN ONLY
 * Uses shared auth middleware for consistent security
 * 
 * PRICE MANAGEMENT ARCHITECTURE:
 * - booking_prices table is the SINGLE SOURCE OF TRUTH
 * - v_booking_payment_guard view derives can_pay from booking_prices
 * - admin_final_price in bookings table is also updated for consistency
 * 
 * Endpoints:
 * GET    /admin-bookings              - List all bookings
 * GET    /admin-bookings/:id          - Get specific booking
 * PUT    /admin-bookings/:id          - Update booking
 * DELETE /admin-bookings/:id          - Delete booking
 * POST   /admin-bookings/:id/set-price      - Set price and lock for payment
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
    
    // Parse URL - handle both direct calls and Supabase edge function routing
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    
    // Find the function name in the path and extract segments after it
    const functionIndex = pathParts.findIndex(p => p === 'admin-bookings')
    const bookingId = functionIndex >= 0 && pathParts.length > functionIndex + 1 
      ? pathParts[functionIndex + 1] 
      : null
    const action = functionIndex >= 0 && pathParts.length > functionIndex + 2 
      ? pathParts[functionIndex + 2] 
      : null

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
    // GET /admin-bookings/:id - Get specific booking with price data
    // =========================================================
    if (method === 'GET' && bookingId && !action) {
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle()

      if (error) throw error
      if (!booking) {
        return errorResponse('Booking not found', 404)
      }

      // Also fetch price data from booking_prices (SINGLE SOURCE OF TRUTH)
      const { data: priceData } = await supabaseAdmin
        .from('booking_prices')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle()

      return jsonResponse({ 
        booking,
        price: priceData ? {
          admin_price: priceData.admin_price,
          locked: priceData.locked,
          currency: priceData.currency,
          can_pay: priceData.admin_price !== null && priceData.locked === true
        } : null
      })
    }

    // =========================================================
    // POST /admin-bookings/:id/set-price
    // CRITICAL: This is the ONLY way to set admin price
    // Writes to booking_prices table (SINGLE SOURCE OF TRUTH)
    // =========================================================
    if (method === 'POST' && bookingId && action === 'set-price') {
      const body = await req.json()
      const { price, admin_notes, currency, lock = true } = body

      // EDGE CASE VALIDATION: Valid price required
      if (typeof price !== 'number' || price <= 0) {
        return errorResponse('Price must be a positive number', 400)
      }
      
      // EDGE CASE: Prevent unrealistic prices (max $100,000)
      if (price > 100000) {
        return errorResponse('Price exceeds maximum allowed ($100,000)', 400)
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, total_price, user_id')
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

      // Check if price is already locked in booking_prices
      const { data: existingPrice } = await supabaseAdmin
        .from('booking_prices')
        .select('locked')
        .eq('booking_id', bookingId)
        .maybeSingle()

      if (existingPrice?.locked === true) {
        return errorResponse('Price is already locked and cannot be modified', 400, 'PRICE_LOCKED')
      }

      // CRITICAL: Upsert into booking_prices table (SINGLE SOURCE OF TRUTH)
      const { error: priceError } = await supabaseAdmin
        .from('booking_prices')
        .upsert({
          booking_id: bookingId,
          admin_price: price,
          amount: price, // Also set amount for consistency
          currency: currency || 'USD',
          locked: lock, // Lock by default when admin sets price
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'booking_id'
        })

      if (priceError) {
        console.error('Error setting booking price in booking_prices:', priceError)
        return errorResponse('Failed to set price in price table', 500)
      }

      // Also update bookings table for consistency (total_price column)
      // ALIGNED WITH DATABASE ENUM - use 'awaiting_payment' not 'awaiting_customer_confirmation'
      const updateData: Record<string, any> = {
        total_price: price,
        status: lock ? 'awaiting_payment' : booking.status,
        updated_at: new Date().toISOString()
      }
      if (admin_notes) updateData.admin_notes = admin_notes

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error updating bookings table:', updateError)
        // Don't fail - booking_prices is the source of truth
      }

      await logAdminAction(supabaseAdmin, user.id, 'price_set', bookingId, 'bookings', {
        price,
        locked: lock,
        old_status: booking.status,
        new_status: lock ? 'awaiting_payment' : booking.status
      })

      // Notify customer if price is locked (ready for payment)
      if (booking.user_id && lock) {
        await supabaseAdmin.from('unified_notifications').insert({
          recipient_id: booking.user_id,
          recipient_type: 'user',
          booking_id: bookingId,
          type: 'price_set',
          title: 'Price Confirmed',
          message: `Your booking price has been set to $${price}. You can now proceed to payment.`
        })
      }

      return jsonResponse({ 
        success: true, 
        price, 
        locked: lock,
        status: lock ? 'awaiting_payment' : booking.status,
        message: lock ? 'Price set and locked - customer can now pay' : 'Price set but not locked'
      })
    }

    // =========================================================
    // POST /admin-bookings/:id/unlock-price
    // Allow admin to unlock price for editing
    // =========================================================
    if (method === 'POST' && bookingId && action === 'unlock-price') {
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, payment_status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return errorResponse('Booking not found', 404)
      }

      // Cannot unlock if already paid
      if (booking.payment_status === 'paid') {
        return errorResponse('Cannot unlock price for paid booking', 400, 'ALREADY_PAID')
      }

      const { error: unlockError } = await supabaseAdmin
        .from('booking_prices')
        .update({ 
          locked: false,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)

      if (unlockError) {
        console.error('Error unlocking price:', unlockError)
        return errorResponse('Failed to unlock price', 500)
      }

      await logAdminAction(supabaseAdmin, user.id, 'price_unlocked', bookingId, 'bookings', {})

      return jsonResponse({ success: true, message: 'Price unlocked for editing' })
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

      // Notify customer via UNIFIED notifications table
      if (booking.user_id) {
        await supabaseAdmin.from('unified_notifications').insert({
          recipient_id: booking.user_id,
          recipient_type: 'user',
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

      // Block price updates after payment via PUT - use set-price action instead
      const lockedStatuses = ['paid', 'in_progress', 'completed']
      if (admin_final_price !== undefined && lockedStatuses.includes(currentBooking.status)) {
        return errorResponse('Cannot update price after payment. Use set-price action for price changes.', 400, 'PRICE_LOCKED')
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (status) updateData.status = status
      if (payment_status) updateData.payment_status = payment_status
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes
      if (assigned_driver_id !== undefined) updateData.assigned_driver_id = assigned_driver_id
      if (assigned_guide_id !== undefined) updateData.assigned_guide_id = assigned_guide_id

      // If admin_final_price is provided via PUT, also update booking_prices table
      if (admin_final_price !== undefined) {
        updateData.admin_final_price = admin_final_price
        
        // Sync to booking_prices table
        await supabaseAdmin
          .from('booking_prices')
          .upsert({
            booking_id: bookingId,
            admin_price: admin_final_price,
            amount: admin_final_price,
            currency: 'USD',
            locked: false, // Don't lock via PUT - use set-price for locking
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'booking_id'
          })
      }

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

      // Notify driver via UNIFIED notifications table
      if (driver_id) {
        await supabaseAdmin.from('unified_notifications').insert({
          recipient_id: driver_id,
          recipient_type: 'driver',
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

      // Notify guide via UNIFIED notifications table
      if (guide_id) {
        await supabaseAdmin.from('unified_notifications').insert({
          recipient_id: guide_id,
          recipient_type: 'guide',
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
      // FIXED: Using only existing tables - unified_notifications instead of legacy tables
      const relatedTables = [
        'transportation_bookings',
        'hotel_bookings',
        'event_bookings',
        'custom_trip_bookings',
        'tourist_guide_bookings',
        'booking_status_history',
        'booking_prices',
        'payment_receipts',
        'unified_notifications'  // FIXED: Use unified table instead of legacy customer/driver/guide_notifications
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
