/**
 * GET-MAPBOX-TOKEN EDGE FUNCTION
 * 
 * Returns the Mapbox public token for map rendering.
 * 
 * Security: Requires authenticated user (any role) to prevent abuse.
 * The token is public anyway, but we gate access to logged-in users.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Require authentication to prevent token scraping abuse
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Validate JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return jsonResponse({ error: 'Invalid or expired token' }, 401)
    }

    // Get Mapbox token from environment
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!mapboxToken) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured')
      return jsonResponse({ error: 'Mapbox token not configured' }, 500)
    }

    console.log(`Mapbox token requested by user: ${user.id}`)
    
    return jsonResponse({ token: mapboxToken })
  } catch (error) {
    console.error('Error getting Mapbox token:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
