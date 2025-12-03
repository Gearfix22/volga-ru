import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // POST /admin-bookings/:id/confirm - Confirm booking
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

      // Update booking status
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          status: 'confirmed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_confirmed',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_status: oldStatus, new_status: 'confirmed' }
      })

      console.log(`Booking ${bookingId} confirmed by admin ${user.id}`)
      return new Response(JSON.stringify({ success: true, status: 'confirmed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /admin-bookings/:id/reject - Reject booking
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
        action_type: 'booking_rejected',
        target_id: bookingId,
        target_table: 'bookings',
        payload: { old_status: oldStatus, new_status: 'cancelled', reason }
      })

      console.log(`Booking ${bookingId} rejected by admin ${user.id}. Reason: ${reason}`)
      return new Response(JSON.stringify({ success: true, status: 'cancelled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /admin-bookings/:id - Update booking
    if (method === 'PUT' && bookingId && !action) {
      const body = await req.json()
      const { status, payment_status, admin_notes, total_price } = body

      const updateData: any = { updated_at: new Date().toISOString() }
      if (status) updateData.status = status
      if (payment_status) updateData.payment_status = payment_status
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes
      if (total_price !== undefined) updateData.total_price = total_price

      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'booking_updated',
        target_id: bookingId,
        target_table: 'bookings',
        payload: updateData
      })

      console.log(`Booking ${bookingId} updated by admin ${user.id}`)
      return new Response(JSON.stringify({ success: true }), {
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