import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

async function checkRateLimit(supabase: any, identifier: string, ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowMinutes = 15;
  const maxAttempts = 5;
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('attempt_type', 'driver_login')
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
    attempt_type: 'driver_login',
    success
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Check if driver exists in drivers table - try multiple phone formats
    const phoneVariants = [
      normalizedPhone,
      `+${normalizedPhone}`,
      normalizedPhone.startsWith('0') ? normalizedPhone.substring(1) : normalizedPhone,
      normalizedPhone.startsWith('0') ? `+${normalizedPhone.substring(1)}` : `+${normalizedPhone}`
    ];

    console.log('Searching for driver with phone variants:', phoneVariants);

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .or(phoneVariants.map(p => `phone.eq.${p}`).join(','))
      .single();

    if (driverError || !driver) {
      await recordAttempt(supabase, normalizedPhone, clientIP, false);
      console.log('Driver not found for phone variants:', phoneVariants);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Driver found:', driver.full_name, 'Phone in DB:', driver.phone);

    // Check driver status
    if (driver.status === 'blocked') {
      await recordAttempt(supabase, normalizedPhone, clientIP, false);
      return new Response(
        JSON.stringify({ error: 'Your account has been blocked. Please contact support.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (driver.status !== 'active') {
      await recordAttempt(supabase, normalizedPhone, clientIP, false);
      return new Response(
        JSON.stringify({ error: 'Your account is pending approval. Please contact admin.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create email from phone for Supabase auth - check both old and new formats
    const driverEmailNew = `driver_${normalizedPhone}@driver.volgaservices.local`;
    const driverEmailOld = `${normalizedPhone}@driver.local`;

    // Check if auth user exists - try to find one that matches driver.id first
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    // First priority: find auth user with ID matching driver.id (ensures RLS works)
    let authUser = existingUsers?.users?.find((u: any) => u.id === driver.id);
    
    // Second priority: find auth user with matching email (any format)
    if (!authUser) {
      authUser = existingUsers?.users?.find((u: any) => 
        u.email === driverEmailNew || u.email === driverEmailOld
      );
    }

    const driverEmail = authUser?.email || driverEmailNew;

    if (!authUser) {
      // Create new auth user for this driver - use driver.id as the auth user id
      console.log('Creating auth user for driver with matching ID:', driver.id);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: driverEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: driver.full_name,
          phone: normalizedPhone,
          role: 'driver'
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
      console.log('Driver auth account created successfully with ID:', authUser.id);
      
      // Sync driver.id if needed
      if (driver.id !== authUser.id) {
        console.log('New auth user has different ID, need to sync driver record');
      }
    } else {
      console.log('Found existing auth user:', authUser.id, 'driver.id:', driver.id);
    }

    // Always ensure driver role exists for this user (handles both new and existing users)
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);

    const hasDriverRole = existingRoles?.some(r => r.role === 'driver');
    
    if (!hasDriverRole) {
      console.log('Assigning driver role to user:', authUser.id);
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: authUser.id, role: 'driver' }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Error assigning driver role:', roleError);
      } else {
        console.log('Driver role assigned successfully');
      }
    }

    // CRITICAL: Update driver record with auth user id to ensure RLS works
    // The driver.id MUST match auth.uid for location tracking RLS policies
    if (driver.id !== authUser.id) {
      console.log('Syncing driver.id with auth.uid:', { old: driver.id, new: authUser.id });
      const { error: updateError } = await supabase
        .from('drivers')
        .update({ id: authUser.id })
        .eq('phone', driver.phone);
      
      if (updateError) {
        console.error('Failed to sync driver.id with auth.uid:', updateError);
        // This is critical - without this sync, location tracking will fail
      } else {
        console.log('Driver.id synced successfully with auth.uid');
        // Update local reference
        driver.id = authUser.id;
      }
    }

    // Now authenticate the driver
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: driverEmail,
      password: password
    });

    if (signInError) {
      // If password doesn't match, update it (first login scenario)
      if (signInError.message.includes('Invalid login credentials')) {
        // Update password for existing user
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
          email: driverEmail,
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
        return new Response(
          JSON.stringify({
            success: true,
            session: retryData.session,
            user: retryData.user,
            driver: driver
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
    
    return new Response(
      JSON.stringify({
        success: true,
        session: signInData.session,
        user: signInData.user,
        driver: driver
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Driver login error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
