import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const driverId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // POST /manage-drivers - Create new driver with auth account
    if (method === 'POST' && !driverId) {
      const body = await req.json()
      const { full_name, phone, password } = body

      if (!full_name || !phone || !password) {
        return new Response(JSON.stringify({ error: 'full_name, phone, and password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create email-like identifier from phone
      const driverEmail = `${phone.replace(/\D/g, '')}@driver.local`

      console.log(`Creating driver account for ${full_name} (${phone})`)

      // Create auth user
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: driverEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
          role: 'driver'
        }
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
        if (createError.message.includes('already been registered')) {
          return new Response(JSON.stringify({ error: 'A driver with this phone number already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        throw createError
      }

      const driverUserId = authData.user.id

      // Assign driver role
      await supabaseAdmin.from('user_roles').insert({
        user_id: driverUserId,
        role: 'driver'
      })

      // Create driver record with matching ID
      const { data: driver, error: driverError } = await supabaseAdmin
        .from('drivers')
        .insert({
          id: driverUserId,
          full_name,
          phone,
          status: 'active'
        })
        .select()
        .single()

      if (driverError) {
        // Rollback auth user if driver creation fails
        await supabaseAdmin.auth.admin.deleteUser(driverUserId)
        throw driverError
      }

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_created',
        target_id: driverUserId,
        target_table: 'drivers',
        payload: { full_name, phone }
      })

      console.log(`Driver ${driverUserId} created successfully`)
      return new Response(JSON.stringify({ success: true, driver }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /manage-drivers/:id - Update driver
    if (method === 'PUT' && driverId && !action) {
      const body = await req.json()
      const { full_name, phone, status } = body

      const updateData: any = { updated_at: new Date().toISOString() }
      if (full_name) updateData.full_name = full_name
      if (phone) updateData.phone = phone
      if (status) updateData.status = status

      const { data, error } = await supabaseAdmin
        .from('drivers')
        .update(updateData)
        .eq('id', driverId)
        .select()
        .single()

      if (error) throw error

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_updated',
        target_id: driverId,
        target_table: 'drivers',
        payload: updateData
      })

      console.log(`Driver ${driverId} updated`)
      return new Response(JSON.stringify({ success: true, driver: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /manage-drivers/:id/approve - Activate driver
    if (method === 'POST' && driverId && action === 'approve') {
      const { error } = await supabaseAdmin
        .from('drivers')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', driverId)

      if (error) throw error

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_approved',
        target_id: driverId,
        target_table: 'drivers',
        payload: { status: 'active' }
      })

      console.log(`Driver ${driverId} approved`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /manage-drivers/:id/block - Deactivate driver
    if (method === 'POST' && driverId && action === 'block') {
      const { error } = await supabaseAdmin
        .from('drivers')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('id', driverId)

      if (error) throw error

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_blocked',
        target_id: driverId,
        target_table: 'drivers',
        payload: { status: 'blocked' }
      })

      console.log(`Driver ${driverId} blocked`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /manage-drivers/:id - Delete driver
    if (method === 'DELETE' && driverId) {
      // Get driver info before deletion
      const { data: driver } = await supabaseAdmin
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single()

      // Unassign from any bookings
      await supabaseAdmin
        .from('bookings')
        .update({ assigned_driver_id: null })
        .eq('assigned_driver_id', driverId)

      // Delete driver record
      const { error: deleteError } = await supabaseAdmin
        .from('drivers')
        .delete()
        .eq('id', driverId)

      if (deleteError) throw deleteError

      // Delete user role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', driverId)

      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(driverId)

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_deleted',
        target_id: driverId,
        target_table: 'drivers',
        payload: { deleted_driver: driver }
      })

      console.log(`Driver ${driverId} deleted`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Error in manage-drivers:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
