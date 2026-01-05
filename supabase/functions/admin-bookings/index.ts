import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valid booking statuses and their allowed transitions
// ALIGNED WITH FRONTEND: pending → confirmed → assigned → accepted → on_trip → completed → paid
const VALID_STATUSES = ['pending', 'confirmed', 'assigned', 'accepted', 'on_trip', 'completed', 'paid', 'cancelled', 'rejected'] as const
type BookingStatus = typeof VALID_STATUSES[number]

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['confirmed', 'cancelled', 'rejected'],
  'confirmed': ['assigned', 'cancelled', 'rejected'],
  'assigned': ['accepted', 'confirmed', 'cancelled', 'rejected'], // Can go back to confirmed if driver rejects
  'accepted': ['on_trip', 'cancelled'],
  'on_trip': ['completed', 'cancelled'],
  'completed': ['paid'],
  'paid': [], // Terminal state
  'cancelled': [], // Terminal state
  'rejected': [], // Terminal state
}

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  // Allow same status (no-op)
  if (currentStatus === newStatus) return true
  
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []
  return allowedTransitions.includes(newStatus)
}

function getValidNextStatuses(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create client with user's token for auth check
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    // Verify user and get their ID
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user has admin role using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      console.error('User is not admin:', user.id, roleError)
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Admin access verified for user:', user.id)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method

    // Parse booking ID from path if present
    // Expected paths: /admin-bookings, /admin-bookings/:id, /admin-bookings/:id/confirm, etc.
    const bookingId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // GET /admin-bookings - List all bookings
    if (method === 'GET' && !bookingId) {
      const status = url.searchParams.get('status')
      const paymentStatus = url.searchParams.get('payment_status')
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')

      let query = supabaseAdmin
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (paymentStatus && paymentStatus !== 'all') {
        query = query.eq('payment_status', paymentStatus)
      }
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching bookings:', error)
        throw error
      }

      console.log(`Fetched ${data?.length || 0} bookings`)
      return new Response(JSON.stringify({ bookings: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /admin-bookings/:id - Get single booking
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

    // POST /admin-bookings/:id/confirm - Confirm booking (move from pending to confirmed)
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
      
      // Determine next valid status based on current status
      let newStatus = 'confirmed'
      if (oldStatus === 'pending') {
        newStatus = 'confirmed'
      } else if (!isValidTransition(oldStatus, 'confirmed')) {
        return new Response(JSON.stringify({ 
          error: `Cannot confirm booking in '${oldStatus}' status`,
          valid_transitions: getValidNextStatuses(oldStatus)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update booking status
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_status_changed',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_status: oldStatus, new_status: newStatus }
      })

      console.log(`Booking ${bookingId} status changed: ${oldStatus} → ${newStatus} by admin ${user.id}`)
      return new Response(JSON.stringify({ success: true, status: newStatus, old_status: oldStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/reject - Cancel booking
    if (method === 'POST' && bookingId && action === 'reject') {
      const body = await req.json()
      const reason = body.reason || 'No reason provided'

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
      
      // Validate transition to cancelled
      if (!isValidTransition(oldStatus, 'cancelled')) {
        return new Response(JSON.stringify({ 
          error: `Cannot cancel booking in '${oldStatus}' status - already finalized`,
          code: 'CANNOT_CANCEL'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update booking status and add reason to admin_notes
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          status: 'cancelled',
          admin_notes: `Rejected: ${reason}`,
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_cancelled',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_status: oldStatus, new_status: 'cancelled', reason }
      })

      console.log(`Booking ${bookingId} cancelled by admin ${user.id}. Reason: ${reason}`)
      return new Response(JSON.stringify({ success: true, status: 'cancelled', old_status: oldStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /admin-bookings/:id - Update booking
    if (method === 'PUT' && bookingId && !action) {
      const body = await req.json()
      const { status, payment_status, admin_notes, total_price, assigned_driver_id } = body

      // Fetch current booking to check status and payment before updates
      const { data: currentBooking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('status, payment_status, total_price')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !currentBooking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // CRITICAL: Validate status transition
      if (status && status !== currentBooking.status) {
        if (!isValidTransition(currentBooking.status, status)) {
          const validNext = getValidNextStatuses(currentBooking.status)
          console.error(`Invalid status transition: ${currentBooking.status} → ${status}`)
          return new Response(JSON.stringify({ 
            error: `Invalid status transition from '${currentBooking.status}' to '${status}'`,
            code: 'INVALID_TRANSITION',
            valid_transitions: validNext
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // CRITICAL: Block price updates after payment is confirmed (status = 'paid')
      if (total_price !== undefined && (currentBooking.status === 'paid' || currentBooking.status === 'completed')) {
        console.error(`Price update blocked for booking ${bookingId} - payment already confirmed`)
        return new Response(JSON.stringify({ 
          error: 'Cannot update price after payment confirmation',
          code: 'PAYMENT_CONFIRMED'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = { updated_at: new Date().toISOString() }
      const oldStatus = currentBooking.status
      
      if (status) updateData.status = status
      if (payment_status) updateData.payment_status = payment_status
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes
      // Admin price edits update admin_final_price (source of truth for admin pricing)
      if (total_price !== undefined) {
        updateData.admin_final_price = total_price
        updateData.total_price = total_price // Keep total_price synced
      }
      if (assigned_driver_id !== undefined) updateData.assigned_driver_id = assigned_driver_id

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action with status transition details
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: status ? 'booking_status_changed' : 'booking_updated',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { 
          ...updateData, 
          old_status: oldStatus,
          old_price: currentBooking.total_price 
        }
      })

      console.log(`Booking ${bookingId} updated by admin ${user.id}. Status: ${oldStatus} → ${status || oldStatus}`)
      return new Response(JSON.stringify({ success: true, booking: { ...currentBooking, ...updateData } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/assign-driver - Assign driver to booking
    if (method === 'POST' && bookingId && action === 'assign-driver') {
      const body = await req.json()
      const { driver_id } = body

      // Validate driver exists and is active if provided
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

      // Get current booking for logging
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('assigned_driver_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const oldDriverId = booking.assigned_driver_id

      // Update booking with driver assignment - CRITICAL: Set status to 'assigned' and driver_response to 'pending'
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          assigned_driver_id: driver_id,
          status: driver_id ? 'assigned' : 'confirmed', // Set to assigned when driver is assigned, back to confirmed if unassigned
          driver_response: driver_id ? 'pending' : null, // Reset driver response when assigned
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_assigned',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { 
          old_driver_id: oldDriverId, 
          new_driver_id: driver_id 
        }
      })

      console.log(`Driver ${driver_id} assigned to booking ${bookingId} by admin ${user.id}`)
      return new Response(JSON.stringify({ success: true, driver_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/auto-assign - Auto-assign available driver
    if (method === 'POST' && bookingId && action === 'auto-assign') {
      // Find an available driver (active status, least assignments)
      const { data: drivers, error: driversError } = await supabaseAdmin
        .from('drivers')
        .select('id, full_name')
        .eq('status', 'active')

      if (driversError || !drivers || drivers.length === 0) {
        return new Response(JSON.stringify({ error: 'No available drivers' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get assignment counts for each driver
      const driverAssignments = await Promise.all(
        drivers.map(async (driver) => {
          const { count } = await supabaseAdmin
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_driver_id', driver.id)
            .in('status', ['pending', 'confirmed'])

          return { ...driver, assignmentCount: count || 0 }
        })
      )

      // Sort by assignment count and pick the driver with least assignments
      driverAssignments.sort((a, b) => a.assignmentCount - b.assignmentCount)
      const selectedDriver = driverAssignments[0]

      // Get current booking for logging
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('assigned_driver_id')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const oldDriverId = booking.assigned_driver_id

      // Update booking with driver assignment - CRITICAL: Set status to 'assigned' and driver_response to 'pending'
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          assigned_driver_id: selectedDriver.id,
          status: 'assigned', // Set to assigned when driver is auto-assigned
          driver_response: 'pending', // Reset driver response
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_auto_assigned',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { 
          old_driver_id: oldDriverId, 
          new_driver_id: selectedDriver.id,
          driver_name: selectedDriver.full_name
        }
      })

      console.log(`Driver ${selectedDriver.full_name} auto-assigned to booking ${bookingId}`)
      return new Response(JSON.stringify({ 
        success: true, 
        driver_id: selectedDriver.id,
        driver_name: selectedDriver.full_name
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/payment - Update payment status
    if (method === 'POST' && bookingId && action === 'payment') {
      const body = await req.json()
      const { payment_status } = body

      if (!payment_status) {
        return new Response(JSON.stringify({ error: 'payment_status required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('payment_status')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const oldPaymentStatus = booking.payment_status

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          payment_status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'payment_status_updated',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_payment_status: oldPaymentStatus, new_payment_status: payment_status }
      })

      console.log(`Payment status for ${bookingId} updated to ${payment_status} by admin ${user.id}`)
      return new Response(JSON.stringify({ success: true, payment_status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /admin-bookings/:id - Delete booking
    if (method === 'DELETE' && bookingId && !action) {
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Delete related records first
      await supabaseAdmin.from('hotel_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('transportation_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('event_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('custom_trip_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('tourist_guide_bookings').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('payment_receipts').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('booking_status_history').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('notifications').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('customer_notifications').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('driver_notifications').delete().eq('booking_id', bookingId)
      await supabaseAdmin.from('guide_notifications').delete().eq('booking_id', bookingId)

      // Delete the booking
      const { error: deleteError } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (deleteError) throw deleteError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_deleted',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { deleted_booking: booking }
      })

      console.log(`Booking ${bookingId} deleted by admin ${user.id}`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in admin-bookings function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})