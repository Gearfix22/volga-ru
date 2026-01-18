/**
 * MANAGE-DRIVERS EDGE FUNCTION
 * 
 * Admin-only CRUD for drivers + public password reset request.
 * Uses shared auth middleware for protected endpoints.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  requireAdmin,
  logAdminAction,
  getClientIP
} from '../_shared/auth.ts'

// Rate limiting configuration for password reset requests
const MAX_RESET_ATTEMPTS = 3;
const RESET_LOCKOUT_DURATION_MINUTES = 30;

// Check rate limit for password reset requests
async function checkResetRateLimit(supabase: any, identifier: string, ip: string): Promise<{ isLimited: boolean }> {
  const cutoffTime = new Date(Date.now() - RESET_LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
  
  const { data: attempts, error } = await supabase
    .from('login_attempts')
    .select('id')
    .or(`identifier.eq.${identifier},ip_address.eq.${ip}`)
    .eq('attempt_type', 'driver_reset')
    .gte('created_at', cutoffTime);

  if (error) {
    console.error('Error checking rate limit:', error);
    return { isLimited: false };
  }

  return { isLimited: (attempts?.length || 0) >= MAX_RESET_ATTEMPTS };
}

// Record password reset attempt
async function recordResetAttempt(supabase: any, identifier: string, ip: string): Promise<void> {
  const { error } = await supabase
    .from('login_attempts')
    .insert({
      identifier,
      ip_address: ip,
      attempt_type: 'driver_reset',
      success: true // We track all reset requests
    });

  if (error) {
    console.error('Error recording reset attempt:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Handle JSON body for POST requests
    let body: any = {}
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        body = await req.json()
      } catch {
        body = {}
      }
    }

    // Handle public password reset request (no auth required, but rate limited)
    if (req.method === 'POST' && body.action === 'request_password_reset') {
      const { phone } = body
      
      if (!phone) {
        return new Response(JSON.stringify({ error: 'Phone number required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const cleanPhone = phone.replace(/\D/g, '')
      const clientIP = getClientIP(req);
      
      // Check rate limit
      const { isLimited } = await checkResetRateLimit(supabaseAdmin, cleanPhone, clientIP);
      
      if (isLimited) {
        console.log(`Rate limit exceeded for password reset: ${cleanPhone} from IP ${clientIP}`);
        return new Response(JSON.stringify({ 
          error: 'Too many password reset requests. Please try again later.',
          retryAfter: RESET_LOCKOUT_DURATION_MINUTES * 60
        }), {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(RESET_LOCKOUT_DURATION_MINUTES * 60)
          }
        })
      }
      
      // Record the reset attempt
      await recordResetAttempt(supabaseAdmin, cleanPhone, clientIP);
      
      // Find driver by phone
      const { data: driver } = await supabaseAdmin
        .from('drivers')
        .select('id, full_name, phone')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (!driver) {
        // Don't reveal if driver exists or not for security
        console.log(`Password reset request for unknown phone: ${cleanPhone}`)
        return new Response(JSON.stringify({ success: true, message: 'If a driver with this phone exists, admin will be notified' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create notification for admin about password reset request using unified_notifications
      await supabaseAdmin.from('unified_notifications').insert({
        recipient_id: 'admin', // Will need admin query to get actual admin IDs
        recipient_type: 'admin',
        type: 'password_reset_request',
        title: 'Driver Password Reset Request',
        message: `Driver ${driver.full_name} (${driver.phone}) requested a password reset`,
        is_read: false
      })

      console.log(`Password reset requested for driver: ${driver.full_name}`)
      return new Response(JSON.stringify({ success: true, message: 'Password reset request submitted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // All other operations require admin auth - use shared middleware
    const authResult = await requireAdmin(req)
    if (authResult instanceof Response) return authResult
    
    const { user, supabaseAdmin: adminClient } = authResult

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const driverId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // Use the admin client from auth context for all subsequent operations
    const supabase = adminClient

    // POST /manage-drivers - Create new driver with auth account
    if (method === 'POST' && !driverId && body.action !== 'reset_driver_password') {
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

    // POST - Admin reset driver password
    if (method === 'POST' && body.action === 'reset_driver_password') {
      const { driver_id, new_password } = body

      if (!driver_id || !new_password) {
        return new Response(JSON.stringify({ error: 'driver_id and new_password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (new_password.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get driver info
      const { data: driver } = await supabaseAdmin
        .from('drivers')
        .select('full_name, phone')
        .eq('id', driver_id)
        .single()

      if (!driver) {
        return new Response(JSON.stringify({ error: 'Driver not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        driver_id,
        { password: new_password }
      )

      if (updateError) {
        console.error('Error updating driver password:', updateError)
        throw updateError
      }

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'driver_password_reset',
        target_id: driver_id,
        target_table: 'drivers',
        payload: { driver_name: driver.full_name, driver_phone: driver.phone }
      })

      console.log(`Admin reset password for driver: ${driver.full_name}`)
      return new Response(JSON.stringify({ success: true, message: 'Password reset successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /manage-drivers/:id - Update driver
    if (method === 'PUT' && driverId && !action) {
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
