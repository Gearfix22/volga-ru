/**
 * NOTIFICATIONS EDGE FUNCTION
 * 
 * Handles notifications for all user types
 * 
 * Mobile-compatible, API-first design
 * 
 * GET  /notifications              - Get user's notifications
 * POST /notifications/:id/read     - Mark notification as read
 * POST /notifications/read-all     - Mark all as read
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext,
  AuthContext
} from '../_shared/auth.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require authentication
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId, roles, supabaseAdmin } = authResult as AuthContext
    
    // Parse URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const notificationId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // Determine recipient type based on role
    const isAdmin = roles.includes('admin')
    const isDriver = roles.includes('driver')
    const isGuide = roles.includes('guide')
    const recipientType = isAdmin ? 'admin' : (isDriver ? 'driver' : (isGuide ? 'guide' : 'user'))

    // =========================================================
    // GET /notifications - Get user's notifications
    // =========================================================
    if (method === 'GET' && !notificationId) {
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const unreadOnly = url.searchParams.get('unread_only') === 'true'

      let query = supabaseAdmin
        .from('unified_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      // For admins, get all admin notifications
      // For others, filter by recipient_id
      if (isAdmin) {
        query = query.eq('recipient_type', 'admin')
      } else {
        query = query.eq('recipient_id', userId)
      }

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error

      // Get unread count
      let countQuery = supabaseAdmin
        .from('unified_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)

      if (isAdmin) {
        countQuery = countQuery.eq('recipient_type', 'admin')
      } else {
        countQuery = countQuery.eq('recipient_id', userId)
      }

      const { count } = await countQuery

      return jsonResponse({
        success: true,
        notifications: data || [],
        unread_count: count || 0
      })
    }

    // =========================================================
    // POST /notifications/read-all - Mark all as read
    // =========================================================
    if (method === 'POST' && notificationId === 'read-all') {
      let updateQuery = supabaseAdmin
        .from('unified_notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (isAdmin) {
        updateQuery = updateQuery.eq('recipient_type', 'admin')
      } else {
        updateQuery = updateQuery.eq('recipient_id', userId)
      }

      const { error } = await updateQuery

      if (error) throw error

      return jsonResponse({
        success: true,
        message: 'All notifications marked as read'
      })
    }

    // =========================================================
    // POST /notifications/:id/read - Mark single as read
    // =========================================================
    if (method === 'POST' && notificationId && action === 'read') {
      // Verify notification belongs to user
      const { data: notification, error: fetchError } = await supabaseAdmin
        .from('unified_notifications')
        .select('id, recipient_id, recipient_type')
        .eq('id', notificationId)
        .maybeSingle()

      if (fetchError || !notification) {
        return errorResponse('Notification not found', 404)
      }

      // Check ownership
      const canAccess = isAdmin 
        ? notification.recipient_type === 'admin'
        : notification.recipient_id === userId

      if (!canAccess) {
        return errorResponse('Forbidden', 403)
      }

      const { error: updateError } = await supabaseAdmin
        .from('unified_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (updateError) throw updateError

      return jsonResponse({
        success: true,
        message: 'Notification marked as read'
      })
    }

    return errorResponse('Not found', 404)

  } catch (error: any) {
    console.error('Notifications error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
