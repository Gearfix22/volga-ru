/**
 * MANAGE-GUIDES EDGE FUNCTION
 * 
 * Admin-only CRUD for guides + public password reset request.
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
    .eq('attempt_type', 'guide_reset')
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
      attempt_type: 'guide_reset',
      success: true
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
      
      // Find guide by phone
      const { data: guide } = await supabaseAdmin
        .from('guides')
        .select('id, full_name, phone')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (!guide) {
        console.log(`Password reset request for unknown phone: ${cleanPhone}`)
        return new Response(JSON.stringify({ success: true, message: 'If a guide with this phone exists, admin will be notified' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create notification for admin about password reset request using unified_notifications
      await supabaseAdmin.from('unified_notifications').insert({
        recipient_id: 'admin', // Will need admin query to get actual admin IDs
        recipient_type: 'admin',
        type: 'password_reset_request',
        title: 'Guide Password Reset Request',
        message: `Guide ${guide.full_name} (${guide.phone}) requested a password reset`,
        is_read: false
      })

      console.log(`Password reset requested for guide: ${guide.full_name}`)
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
    const guideId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // Use the admin client from auth context for all subsequent operations
    const supabase = adminClient

    // POST /manage-guides - Create new guide with auth account
    if (method === 'POST' && !guideId && body.action !== 'reset_guide_password') {
      const { full_name, phone, password, languages, specialization, hourly_rate } = body

      if (!full_name || !phone || !password) {
        return new Response(JSON.stringify({ error: 'full_name, phone, and password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (password.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create email-like identifier from phone
      const guideEmail = `${phone.replace(/\D/g, '')}@guide.local`

      console.log(`Creating guide account for ${full_name} (${phone})`)

      // Create auth user
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: guideEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
          role: 'guide'
        }
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
        if (createError.message.includes('already been registered')) {
          return new Response(JSON.stringify({ error: 'A guide with this phone number already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        throw createError
      }

      const guideUserId = authData.user.id

      // Assign guide role
      await supabaseAdmin.from('user_roles').insert({
        user_id: guideUserId,
        role: 'guide'
      })

      // Create guide record with matching ID
      const { data: guide, error: guideError } = await supabaseAdmin
        .from('guides')
        .insert({
          id: guideUserId,
          full_name,
          phone,
          status: 'active',
          languages: languages || ['English'],
          specialization: specialization || ['City Tours'],
          hourly_rate: hourly_rate || 50
        })
        .select()
        .single()

      if (guideError) {
        // Rollback auth user if guide creation fails
        await supabaseAdmin.auth.admin.deleteUser(guideUserId)
        throw guideError
      }

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'guide_created',
        target_id: guideUserId,
        target_table: 'guides',
        payload: { full_name, phone }
      })

      console.log(`Guide ${guideUserId} created successfully`)
      return new Response(JSON.stringify({ success: true, guide }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST - Admin reset guide password
    if (method === 'POST' && body.action === 'reset_guide_password') {
      const { guide_id, new_password } = body

      if (!guide_id || !new_password) {
        return new Response(JSON.stringify({ error: 'guide_id and new_password required' }), {
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

      // Get guide info
      const { data: guide } = await supabaseAdmin
        .from('guides')
        .select('full_name, phone')
        .eq('id', guide_id)
        .single()

      if (!guide) {
        return new Response(JSON.stringify({ error: 'Guide not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        guide_id,
        { password: new_password }
      )

      if (updateError) {
        console.error('Error updating guide password:', updateError)
        throw updateError
      }

      // Log admin action
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'guide_password_reset',
        target_id: guide_id,
        target_table: 'guides',
        payload: { guide_name: guide.full_name, guide_phone: guide.phone }
      })

      console.log(`Admin reset password for guide: ${guide.full_name}`)
      return new Response(JSON.stringify({ success: true, message: 'Password reset successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /manage-guides/:id - Update guide
    if (method === 'PUT' && guideId && !action) {
      const { full_name, phone, status, languages, specialization, hourly_rate } = body

      const updateData: any = { updated_at: new Date().toISOString() }
      if (full_name) updateData.full_name = full_name
      if (phone) updateData.phone = phone
      if (status) updateData.status = status
      if (languages) updateData.languages = languages
      if (specialization) updateData.specialization = specialization
      if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate

      const { data, error } = await supabaseAdmin
        .from('guides')
        .update(updateData)
        .eq('id', guideId)
        .select()
        .single()

      if (error) throw error

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'guide_updated',
        target_id: guideId,
        target_table: 'guides',
        payload: updateData
      })

      console.log(`Guide ${guideId} updated`)
      return new Response(JSON.stringify({ success: true, guide: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /manage-guides/:id/approve - Activate guide
    if (method === 'POST' && guideId && action === 'approve') {
      const { error } = await supabaseAdmin
        .from('guides')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', guideId)

      if (error) throw error

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'guide_approved',
        target_id: guideId,
        target_table: 'guides',
        payload: { status: 'active' }
      })

      console.log(`Guide ${guideId} approved`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /manage-guides/:id/block - Deactivate guide
    if (method === 'POST' && guideId && action === 'block') {
      const { error } = await supabaseAdmin
        .from('guides')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('id', guideId)

      if (error) throw error

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'guide_blocked',
        target_id: guideId,
        target_table: 'guides',
        payload: { status: 'blocked' }
      })

      console.log(`Guide ${guideId} blocked`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /manage-guides/:id - Delete guide
    if (method === 'DELETE' && guideId) {
      // Get guide info before deletion
      const { data: guide } = await supabaseAdmin
        .from('guides')
        .select('*')
        .eq('id', guideId)
        .single()

      // Unassign from any bookings
      await supabaseAdmin
        .from('bookings')
        .update({ assigned_guide_id: null })
        .eq('assigned_guide_id', guideId)

      // Delete guide record
      const { error: deleteError } = await supabaseAdmin
        .from('guides')
        .delete()
        .eq('id', guideId)

      if (deleteError) throw deleteError

      // Delete user role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', guideId)

      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(guideId)

      await supabaseAdmin.from('admin_logs').insert({
        admin_id: user.id,
        action_type: 'guide_deleted',
        target_id: guideId,
        target_table: 'guides',
        payload: { deleted_guide: guide }
      })

      console.log(`Guide ${guideId} deleted`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Error in manage-guides:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
