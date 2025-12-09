import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get admin credentials from environment
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');

    console.log('Admin login attempt for email:', email);
    console.log('ADMIN_EMAIL configured:', adminEmail ? 'YES' : 'NO');
    console.log('ADMIN_PASSWORD configured:', adminPassword ? 'YES' : 'NO');
    console.log('Email match:', email === adminEmail);
    console.log('Password match:', password === adminPassword);

    // Validate credentials
    if (email !== adminEmail || password !== adminPassword) {
      console.log('Invalid admin credentials - email match:', email === adminEmail, ', password match:', password === adminPassword);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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