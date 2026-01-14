import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse, handleCors, getClientIP } from '../_shared/auth.ts';

async function checkRateLimit(supabase: any, identifier: string, ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowMinutes = 15;
  const maxAttempts = 5;
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('attempt_type', 'guide_login')
    .or(`identifier.eq.${identifier},ip_address.eq.${ip}`)
    .gte('created_at', windowStart);

  if (count && count >= maxAttempts) {
    return { allowed: false, retryAfter: windowMinutes * 60 };
  }
  return { allowed: true };
}

async function recordAttempt(supabase: any, identifier: string, ip: string, success: boolean): Promise<void> {
  await supabase.from('login_attempts').insert({
    identifier,
    ip_address: ip,
    attempt_type: 'guide_login',
    success
  });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone, password } = await req.json();
    const clientIP = getClientIP(req);

    if (!phone || !password) {
      return new Response(
        JSON.stringify({ error: 'Phone and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone number - remove all non-digits
    const normalizedPhone = phone.replace(/\D/g, '');
    
    // Check rate limit
    const rateLimitCheck = await checkRateLimit(supabase, normalizedPhone, clientIP);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if guide exists in guides table - try multiple phone formats
    const phoneVariants = [
      normalizedPhone,
      `+${normalizedPhone}`,
      normalizedPhone.startsWith('0') ? normalizedPhone.substring(1) : normalizedPhone,
      normalizedPhone.startsWith('0') ? `+${normalizedPhone.substring(1)}` : `+${normalizedPhone}`
    ];

    console.log('Searching for guide with phone variants:', phoneVariants);

    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('*')
      .or(phoneVariants.map(p => `phone.eq.${p}`).join(','))
      .single();

    if (guideError || !guide) {
      await recordAttempt(supabase, normalizedPhone, clientIP, false);
      console.log('Guide not found for phone variants:', phoneVariants);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Guide found:', guide.full_name, 'Phone in DB:', guide.phone);

    // Check guide status
    if (guide.status === 'blocked') {
      await recordAttempt(supabase, normalizedPhone, clientIP, false);
      return new Response(
        JSON.stringify({ error: 'Your account has been blocked. Please contact support.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (guide.status !== 'active') {
      await recordAttempt(supabase, normalizedPhone, clientIP, false);
      return new Response(
        JSON.stringify({ error: 'Your account is pending approval. Please contact admin.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create email from phone for Supabase auth
    const guideEmailNew = `guide_${normalizedPhone}@guide.volgaservices.local`;
    const guideEmailOld = `${normalizedPhone}@guide.local`;

    // Check if auth user exists - try to find one that matches guide.id first
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    // First priority: find auth user with ID matching guide.id (ensures RLS works)
    let authUser = existingUsers?.users?.find((u: any) => u.id === guide.id);
    
    // Second priority: find auth user with matching email (any format)
    if (!authUser) {
      authUser = existingUsers?.users?.find((u: any) => 
        u.email === guideEmailNew || u.email === guideEmailOld
      );
    }

    const guideEmail = authUser?.email || guideEmailNew;

    if (!authUser) {
      // Create new auth user for this guide
      console.log('Creating auth user for guide with matching ID:', guide.id);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: guideEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: guide.full_name,
          phone: normalizedPhone,
          role: 'guide'
        }
      });

      if (createError) {
        console.error('Error creating auth user:', createError);
        await recordAttempt(supabase, normalizedPhone, clientIP, false);
        return new Response(
          JSON.stringify({ error: 'Failed to create account. Please contact admin.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = newUser.user;
      console.log('Guide auth account created successfully with ID:', authUser.id);
    } else {
      console.log('Found existing auth user:', authUser.id, 'guide.id:', guide.id);
    }

    // Always ensure guide role exists for this user
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);

    const hasGuideRole = existingRoles?.some(r => r.role === 'guide');
    
    if (!hasGuideRole) {
      console.log('Assigning guide role to user:', authUser.id);
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: authUser.id, role: 'guide' }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Error assigning guide role:', roleError);
      } else {
        console.log('Guide role assigned successfully');
      }
    }

    // CRITICAL: Update guide record with auth user id to ensure RLS works
    if (guide.id !== authUser.id) {
      console.log('Syncing guide.id with auth.uid:', { old: guide.id, new: authUser.id });
      const { error: updateError } = await supabase
        .from('guides')
        .update({ id: authUser.id })
        .eq('phone', guide.phone);
      
      if (updateError) {
        console.error('Failed to sync guide.id with auth.uid:', updateError);
      } else {
        console.log('Guide.id synced successfully with auth.uid');
        guide.id = authUser.id;
      }
    }

    // Now authenticate the guide
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: guideEmail,
      password: password
    });

    if (signInError) {
      // If password doesn't match, update it (first login scenario)
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          { password: password }
        );

        if (updateError) {
          await recordAttempt(supabase, normalizedPhone, clientIP, false);
          return new Response(
            JSON.stringify({ error: 'Invalid credentials' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try signing in again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: guideEmail,
          password: password
        });

        if (retryError) {
          await recordAttempt(supabase, normalizedPhone, clientIP, false);
          return new Response(
            JSON.stringify({ error: 'Invalid credentials' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await recordAttempt(supabase, normalizedPhone, clientIP, true);
        
        // Log auth session for guide
        await supabase.from('auth_sessions').insert({
          user_id: retryData.user.id,
          user_role: 'guide',
          event_type: 'login',
          ip_address: clientIP,
          user_agent: req.headers.get('user-agent') || null
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            session: retryData.session,
            user: retryData.user,
            guide: guide
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await recordAttempt(supabase, normalizedPhone, clientIP, false);
      console.error('Sign in error:', signInError);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await recordAttempt(supabase, normalizedPhone, clientIP, true);
    
    // Log auth session for guide
    await supabase.from('auth_sessions').insert({
      user_id: signInData.user.id,
      user_role: 'guide',
      event_type: 'login',
      ip_address: clientIP,
      user_agent: req.headers.get('user-agent') || null
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        session: signInData.session,
        user: signInData.user,
        guide: guide
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Guide login error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});