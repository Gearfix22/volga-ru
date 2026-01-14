/**
 * GET-MAPBOX-TOKEN EDGE FUNCTION
 * 
 * Returns the Mapbox public token for map rendering.
 * Uses shared auth middleware for consistent security.
 * 
 * Security: Requires authenticated user (any role) to prevent abuse.
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext
} from '../_shared/auth.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require authentication (any role)
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId } = authResult

    // Get Mapbox token from environment
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!mapboxToken) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured')
      return errorResponse('Mapbox token not configured', 500)
    }

    console.log(`Mapbox token requested by user: ${userId}`)
    
    return jsonResponse({ token: mapboxToken })
  } catch (error: any) {
    console.error('Error getting Mapbox token:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
