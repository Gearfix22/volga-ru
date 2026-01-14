/**
 * SHARED AUTHENTICATION MIDDLEWARE FOR EDGE FUNCTIONS
 * 
 * This module provides production-grade authentication and authorization
 * for all edge functions in the Volga Services platform.
 * 
 * KEY PRINCIPLES:
 * - Never trust client data
 * - Always validate JWT tokens server-side
 * - Use database-driven role checks (no hardcoded roles)
 * - Return consistent error responses
 */

import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'

export type AppRole = 'admin' | 'user' | 'driver' | 'guide'

export interface AuthResult {
  success: boolean
  user?: User
  userId?: string
  roles?: AppRole[]
  error?: string
  status?: number
}

export interface AuthContext {
  user: User
  userId: string
  roles: AppRole[]
  supabaseAdmin: SupabaseClient
  supabaseUser: SupabaseClient
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Creates a JSON response with CORS headers
 */
export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * Creates an error response with consistent format
 */
export function errorResponse(error: string, status: number = 400, code?: string): Response {
  return jsonResponse({ error, code, success: false }, status)
}

/**
 * Validates the Authorization header and returns user info + roles
 * Does NOT check for specific roles - use requireRole/requireAnyRole for that
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header',
      status: 401
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    return {
      success: false,
      error: 'Server configuration error',
      status: 500
    }
  }

  try {
    // Create a client that uses the user's JWT for auth
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Validate the JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token)

    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
        status: 401
      }
    }

    // Get user roles from database (single source of truth)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roleError) {
      console.error('Error fetching user roles:', roleError)
      return {
        success: false,
        error: 'Failed to fetch user roles',
        status: 500
      }
    }

    const roles = (roleData || []).map(r => r.role as AppRole)

    return {
      success: true,
      user,
      userId: user.id,
      roles
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    }
  }
}

/**
 * Full authentication that also creates Supabase clients for use in handlers
 */
export async function getAuthContext(req: Request): Promise<AuthContext | Response> {
  const authResult = await authenticateRequest(req)
  
  if (!authResult.success) {
    return errorResponse(authResult.error!, authResult.status || 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization')!

  return {
    user: authResult.user!,
    userId: authResult.userId!,
    roles: authResult.roles!,
    supabaseAdmin: createClient(supabaseUrl, supabaseServiceKey),
    supabaseUser: createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })
  }
}

/**
 * Checks if user has a specific role
 */
export function hasRole(roles: AppRole[], requiredRole: AppRole): boolean {
  return roles.includes(requiredRole)
}

/**
 * Checks if user has any of the specified roles
 */
export function hasAnyRole(roles: AppRole[], requiredRoles: AppRole[]): boolean {
  return requiredRoles.some(r => roles.includes(r))
}

/**
 * Middleware to require authentication + specific role(s)
 * Returns Response if failed, AuthContext if successful
 */
export async function requireRole(
  req: Request, 
  requiredRole: AppRole | AppRole[]
): Promise<AuthContext | Response> {
  const context = await getAuthContext(req)
  
  // If it's a Response, authentication failed
  if (context instanceof Response) {
    return context
  }

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  
  if (!hasAnyRole(context.roles, requiredRoles)) {
    return errorResponse(
      `Forbidden: Requires one of these roles: ${requiredRoles.join(', ')}`,
      403,
      'INSUFFICIENT_PERMISSIONS'
    )
  }

  return context
}

/**
 * Middleware to require admin role specifically
 */
export async function requireAdmin(req: Request): Promise<AuthContext | Response> {
  return requireRole(req, 'admin')
}

/**
 * Parse URL path to extract function name, resource ID, and action
 * Example: /admin-bookings/123/confirm -> { resourceId: '123', action: 'confirm' }
 */
export function parseUrlPath(url: URL): { resourceId: string | null; action: string | null } {
  const pathParts = url.pathname.split('/').filter(Boolean)
  
  // Remove the function name (first part after /functions/v1/)
  // Path looks like: /admin-bookings or /admin-bookings/id or /admin-bookings/id/action
  const resourceId = pathParts.length > 1 ? pathParts[1] : null
  const action = pathParts.length > 2 ? pathParts[2] : null
  
  return { resourceId, action }
}

/**
 * Logs an action to the admin_logs table
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  actionType: string,
  targetId: string | null,
  targetTable: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action_type: actionType,
      target_id: targetId,
      target_table: targetTable,
      payload
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging should not break the main operation
  }
}
