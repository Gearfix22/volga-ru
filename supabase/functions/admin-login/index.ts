import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Get client IP from request headers
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Check if user is rate limited
async function checkRateLimit(supabase: any, identifier: string, ip: string): Promise<{ isLimited: boolean; remainingAttempts: number }> {
  const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
  
  // Count recent failed attempts for this identifier or IP
  const { data: attempts, error } = await supabase
    .from('login_attempts')
    .select('id')
    .or(`identifier.eq.${identifier},ip_address.eq.${ip}`)
    .eq('success', false)
    .eq('attempt_type', 'admin')
    .gte('created_at', cutoffTime);

  if (error) {
    console.error('Error checking rate limit:', error);
    return { isLimited: false, remainingAttempts: MAX_ATTEMPTS };
  }

  const attemptCount = attempts?.length || 0;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptCount);
  
  return { 
    isLimited: attemptCount >= MAX_ATTEMPTS,
    remainingAttempts 
  };
}

// Record login attempt
async function recordAttempt(supabase: any, identifier: string, ip: string, success: boolean): Promise<void> {
  const { error } = await supabase
    .from('login_attempts')
    .insert({
      identifier,
      ip_address: ip,
      attempt_type: 'admin',
      success
    });

  if (error) {
    console.error('Error recording login attempt:', error);
  }
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP
    const clientIP = getClientIP(req);

    // Check rate limiting
    const { isLimited, remainingAttempts } = await checkRateLimit(supabase, email, clientIP);
    
    if (isLimited) {
      console.log(`Rate limit exceeded for admin login: ${email} from IP ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: LOCKOUT_DURATION_MINUTES * 60
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(LOCKOUT_DURATION_MINUTES * 60)
          } 
        }
      );
    }

    // Get admin credentials from environment
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');

    // Log attempt without exposing sensitive data
    console.log('Admin login attempt:', {
      attemptedEmail: email,
      adminEmailConfigured: !!adminEmail,
      adminPasswordConfigured: !!adminPassword,
      clientIP,
      remainingAttempts,
      timestamp: new Date().toISOString()
    });

    // Validate credentials using constant-time comparison
    const emailMatch = adminEmail ? constantTimeCompare(email, adminEmail) : false;
    const passwordMatch = adminPassword ? constantTimeCompare(password, adminPassword) : false;
    
    if (!emailMatch || !passwordMatch) {
      // Record failed attempt
      await recordAttempt(supabase, email, clientIP, false);
      
      console.log('Admin login failed: invalid credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid credentials',
          remainingAttempts: remainingAttempts - 1
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the admin user from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    let adminUser = users.find(u => u.email === adminEmail);
    
    // If admin user doesn't exist, create them
    if (!adminUser) {
      console.log('Admin user not found, creating...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });
      
      if (createError) {
        console.error('Error creating admin user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create admin user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      adminUser = newUser.user;
      console.log('Admin user created:', adminUser.id);
      
      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: adminUser.id, role: 'admin' });
      
      if (roleError) {
        console.error('Error assigning admin role:', roleError);
      } else {
        console.log('Admin role assigned');
      }
    }

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Error checking role:', roleError);
    }
    
    // If no admin role, add it
    if (!roleData) {
      console.log('Admin role missing, adding...');
      await supabase
        .from('user_roles')
        .insert({ user_id: adminUser.id, role: 'admin' });
    }

    if (roleError || !roleData) {
      console.log('User does not have admin role');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record successful attempt
    await recordAttempt(supabase, email, clientIP, true);
    
    console.log('Admin login successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        session: signInData.session,
        user: signInData.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
