import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * FINAL BOOKING WORKFLOW STATUS TRANSITIONS:
 * 
 * draft → under_review → awaiting_customer_confirmation → paid → in_progress → completed
 * 
 * Terminal states: cancelled, rejected
 */
const VALID_STATUSES = [
  'draft', 
  'under_review', 
  'awaiting_customer_confirmation', 
  'paid', 
  'in_progress', 
  'completed', 
  'cancelled', 
  'rejected'
] as const
type BookingStatus = typeof VALID_STATUSES[number]

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'draft': ['under_review', 'cancelled'],
  'under_review': ['awaiting_customer_confirmation', 'cancelled', 'rejected'],
  'awaiting_customer_confirmation': ['paid', 'cancelled'],
  'paid': ['in_progress'],
  'in_progress': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': [],
  'rejected': [],
}

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []
  return allowedTransitions.includes(newStatus)
}

function getValidNextStatuses(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const bookingId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // GET /admin-bookings - List all bookings
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

      return new Response(JSON.stringify({ bookings: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /admin-bookings/:id
    if (method === 'GET' && bookingId && !action) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ booking: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/set-price - Admin sets price and moves to awaiting_customer_confirmation
    if (method === 'POST' && bookingId && action === 'set-price') {
      const body = await req.json()
      const { price, admin_notes, currency } = body

      if (typeof price !== 'number' || price <= 0) {
        return new Response(JSON.stringify({ error: 'Valid price is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, admin_final_price, user_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Can only set price if status allows it
      const editableStatuses = ['draft', 'under_review', 'awaiting_customer_confirmation', 'pending']
      if (!editableStatuses.includes(booking.status)) {
        return new Response(JSON.stringify({ 
          error: `Cannot set price for booking in '${booking.status}' status`,
          code: 'PRICE_LOCKED'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Upsert into booking_prices table (single source of truth)
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
        return new Response(JSON.stringify({ error: 'Failed to set price' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Also update admin_final_price on bookings for backward compatibility
      const updateData: any = {
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

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'price_set',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { price, old_status: booking.status, new_status: 'awaiting_customer_confirmation' }
      })

      // Notify customer about price
      if (booking.user_id) {
        await supabaseAdmin.from('customer_notifications').insert({
          user_id: booking.user_id,
          booking_id: bookingId,
          type: 'price_set',
          title: 'Price Confirmed',
          message: `Your booking price has been set to $${price}. Please confirm and proceed to payment.`
        })
      }

      return new Response(JSON.stringify({ success: true, price, status: 'awaiting_customer_confirmation' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/confirm - Move to under_review (legacy support)
    if (method === 'POST' && bookingId && action === 'confirm') {
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const oldStatus = booking.status
      const newStatus = 'under_review'

      if (!isValidTransition(oldStatus, newStatus) && oldStatus !== 'pending') {
        return new Response(JSON.stringify({ 
          error: `Cannot confirm booking in '${oldStatus}' status`,
          valid_transitions: getValidNextStatuses(oldStatus)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      if (updateError) throw updateError

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_status_changed',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_status: oldStatus, new_status: newStatus }
      })

      return new Response(JSON.stringify({ success: true, status: newStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/reject
    if (method === 'POST' && bookingId && action === 'reject') {
      const body = await req.json()
      const reason = body.reason || 'No reason provided'

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, user_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const oldStatus = booking.status
      const terminalStates = ['completed', 'cancelled', 'rejected']
      
      if (terminalStates.includes(oldStatus)) {
        return new Response(JSON.stringify({ 
          error: `Cannot reject booking in '${oldStatus}' status`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
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

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_rejected',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_status: oldStatus, reason }
      })

      return new Response(JSON.stringify({ success: true, status: 'rejected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /admin-bookings/:id - Update booking
    if (method === 'PUT' && bookingId && !action) {
      const body = await req.json()
      const { status, payment_status, admin_notes, admin_final_price, assigned_driver_id, assigned_guide_id } = body

      const { data: currentBooking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, payment_status, admin_final_price, quoted_price')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !currentBooking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate status transition
      if (status && status !== currentBooking.status) {
        if (!isValidTransition(currentBooking.status, status)) {
          return new Response(JSON.stringify({ 
            error: `Invalid status transition from '${currentBooking.status}' to '${status}'`,
            code: 'INVALID_TRANSITION',
            valid_transitions: getValidNextStatuses(currentBooking.status)
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // CRITICAL: Block price updates after payment
      const lockedStatuses = ['paid', 'in_progress', 'completed']
      if (admin_final_price !== undefined && lockedStatuses.includes(currentBooking.status)) {
        return new Response(JSON.stringify({ 
          error: 'Cannot update price after payment',
          code: 'PRICE_LOCKED'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = { updated_at: new Date().toISOString() }
      
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

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: status ? 'booking_status_changed' : 'booking_updated',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { ...updateData, old_status: currentBooking.status }
      })

      return new Response(JSON.stringify({ success: true, booking: { ...currentBooking, ...updateData } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/payment - Update payment status
    if (method === 'POST' && bookingId && action === 'payment') {
      const body = await req.json()
      const { payment_status } = body

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ payment_status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      if (updateError) throw updateError

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'payment_status_updated',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { payment_status }
      })

      return new Response(JSON.stringify({ success: true, payment_status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/assign-driver
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
          return new Response(JSON.stringify({ error: 'Driver not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (driver.status !== 'active') {
          return new Response(JSON.stringify({ error: 'Driver is not available' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('assigned_driver_id, status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = {
        assigned_driver_id: driver_id,
        driver_response: driver_id ? 'pending' : null,
        updated_at: new Date().toISOString()
      }

      // If booking is 'paid' and driver assigned, move to 'in_progress'
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
          driver_id: driver_id,
          booking_id: bookingId,
          type: 'new_assignment',
          title: 'New Booking Assignment',
          message: 'You have been assigned to a new booking.'
        })
      }

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_assigned',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_driver_id: booking.assigned_driver_id, new_driver_id: driver_id }
      })

      return new Response(JSON.stringify({ success: true, driver_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/assign-guide
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
          return new Response(JSON.stringify({ error: 'Guide not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (guide.status !== 'active') {
          return new Response(JSON.stringify({ error: 'Guide is not available' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('assigned_guide_id, status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = {
        assigned_guide_id: guide_id,
        updated_at: new Date().toISOString()
      }

      // If booking is 'paid' and guide assigned, move to 'in_progress'
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
          guide_id: guide_id,
          booking_id: bookingId,
          type: 'new_assignment',
          title: 'New Booking Assignment',
          message: 'You have been assigned to a new booking.'
        })
      }

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'guide_assigned',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_guide_id: booking.assigned_guide_id, new_guide_id: guide_id }
      })

      return new Response(JSON.stringify({ success: true, guide_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /admin-bookings/:id
    if (method === 'DELETE' && bookingId && !action) {
      // Delete related records first
      await supabaseAdmin.from('transportation_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('hotel_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('event_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('custom_trip_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('tourist_guide_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('booking_status_history').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('payment_receipts').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('customer_notifications').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('driver_notifications').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('guide_notifications').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('notifications').delete().eq('booking_id', bookingId)

      const { error } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_deleted',
        target_id: bookingId,
        target_table: 'bookings',
        payload: {}
      })

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin bookings error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
