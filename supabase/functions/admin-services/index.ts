/**
 * ADMIN-SERVICES EDGE FUNCTION
 * 
 * Full CRUD operations for services - ADMIN ONLY
 * Mobile-compatible, API-first design
 * 
 * Endpoints:
 * GET    /admin-services              - List all services
 * GET    /admin-services/:id          - Get specific service
 * POST   /admin-services              - Create new service
 * PUT    /admin-services/:id          - Update service
 * DELETE /admin-services/:id          - Delete service
 * POST   /admin-services/:id/toggle   - Toggle active status
 * POST   /admin-services/reorder      - Bulk reorder services
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  requireAdmin,
  logAdminAction,
  AuthContext
} from '../_shared/auth.ts'

// Valid service types
const VALID_SERVICE_TYPES = ['Driver', 'Accommodation', 'Events', 'Guide'] as const

// Validate service payload
function validateServicePayload(payload: any, isCreate: boolean = true): { valid: boolean; error?: string } {
  if (isCreate) {
    if (!payload.name?.trim()) {
      return { valid: false, error: 'Service name is required' }
    }
    if (!payload.type || !VALID_SERVICE_TYPES.includes(payload.type)) {
      return { valid: false, error: `Service type must be one of: ${VALID_SERVICE_TYPES.join(', ')}` }
    }
  }
  
  if (payload.base_price !== undefined && payload.base_price !== null) {
    if (typeof payload.base_price !== 'number' || payload.base_price < 0) {
      return { valid: false, error: 'Base price must be a non-negative number' }
    }
  }
  
  if (payload.display_order !== undefined && typeof payload.display_order !== 'number') {
    return { valid: false, error: 'Display order must be a number' }
  }
  
  return { valid: true }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require admin role
    const authResult = await requireAdmin(req)
    if (authResult instanceof Response) return authResult
    
    const { user, supabaseAdmin } = authResult as AuthContext
    
    // Parse URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const serviceId = pathParts.length > 1 ? pathParts[1] : null
    const action = pathParts.length > 2 ? pathParts[2] : null

    // =========================================================
    // GET /admin-services - List all services
    // =========================================================
    if (method === 'GET' && !serviceId) {
      const includeInactive = url.searchParams.get('include_inactive') === 'true'
      
      let query = supabaseAdmin
        .from('services')
        .select('*')
        .order('display_order', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query
      if (error) throw error

      return jsonResponse({ 
        success: true,
        services: data,
        count: data?.length || 0
      })
    }

    // =========================================================
    // POST /admin-services/reorder - Bulk reorder services
    // =========================================================
    if (method === 'POST' && serviceId === 'reorder') {
      const body = await req.json()
      const { orders } = body
      
      if (!Array.isArray(orders)) {
        return errorResponse('Orders must be an array of {id, display_order}', 400)
      }

      for (const order of orders) {
        if (!order.id || typeof order.display_order !== 'number') {
          return errorResponse('Each order must have id and display_order', 400)
        }
        
        const { error } = await supabaseAdmin
          .from('services')
          .update({ display_order: order.display_order })
          .eq('id', order.id)

        if (error) throw error
      }

      await logAdminAction(supabaseAdmin, user.id, 'services_reordered', null, 'services', { orders })
      
      return jsonResponse({ success: true, message: 'Services reordered' })
    }

    // =========================================================
    // GET /admin-services/:id - Get specific service
    // =========================================================
    if (method === 'GET' && serviceId && !action) {
      const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return errorResponse('Service not found', 404)
      }

      return jsonResponse({ success: true, service: data })
    }

    // =========================================================
    // POST /admin-services - Create new service
    // =========================================================
    if (method === 'POST' && !serviceId) {
      const body = await req.json()
      
      const validation = validateServicePayload(body, true)
      if (!validation.valid) {
        return errorResponse(validation.error!, 400)
      }

      const insertData = {
        name: body.name.trim(),
        type: body.type,
        description: body.description || null,
        base_price: body.base_price || null,
        currency: body.currency || 'USD',
        image_url: body.image_url || null,
        features: body.features || null,
        is_active: body.is_active !== false, // Default true
        category_id: body.category_id || null,
        display_order: body.display_order || 0,
        service_type: body.service_type || null,
        status: body.status || 'active',
        // Multilingual fields
        name_en: body.name_en || body.name?.trim() || null,
        name_ar: body.name_ar || null,
        name_ru: body.name_ru || null,
        description_en: body.description_en || body.description || null,
        description_ar: body.description_ar || null,
        description_ru: body.description_ru || null
      }

      const { data, error } = await supabaseAdmin
        .from('services')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Create service error:', error)
        return errorResponse(`Failed to create service: ${error.message}`, 500)
      }

      await logAdminAction(supabaseAdmin, user.id, 'service_created', data.id, 'services', { 
        name: data.name,
        type: data.type 
      })

      return jsonResponse({ 
        success: true, 
        service: data,
        message: 'Service created successfully'
      }, 201)
    }

    // =========================================================
    // POST /admin-services/:id/toggle - Toggle active status
    // =========================================================
    if (method === 'POST' && serviceId && action === 'toggle') {
      const { data: service, error: fetchError } = await supabaseAdmin
        .from('services')
        .select('is_active, name')
        .eq('id', serviceId)
        .maybeSingle()

      if (fetchError || !service) {
        return errorResponse('Service not found', 404)
      }

      const newStatus = !service.is_active
      
      const { error: updateError } = await supabaseAdmin
        .from('services')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)

      if (updateError) throw updateError

      await logAdminAction(
        supabaseAdmin, 
        user.id, 
        newStatus ? 'service_activated' : 'service_deactivated', 
        serviceId, 
        'services', 
        { name: service.name }
      )

      return jsonResponse({ 
        success: true, 
        is_active: newStatus,
        message: `Service ${newStatus ? 'activated' : 'deactivated'}`
      })
    }

    // =========================================================
    // PUT /admin-services/:id - Update service
    // =========================================================
    if (method === 'PUT' && serviceId && !action) {
      const body = await req.json()
      
      const validation = validateServicePayload(body, false)
      if (!validation.valid) {
        return errorResponse(validation.error!, 400)
      }

      // Verify service exists
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('services')
        .select('id')
        .eq('id', serviceId)
        .maybeSingle()

      if (fetchError || !existing) {
        return errorResponse('Service not found', 404)
      }

      // Build update payload
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      }
      
      if (body.name !== undefined) updateData.name = body.name.trim()
      if (body.type !== undefined) updateData.type = body.type
      if (body.description !== undefined) updateData.description = body.description
      if (body.base_price !== undefined) updateData.base_price = body.base_price
      if (body.currency !== undefined) updateData.currency = body.currency
      if (body.image_url !== undefined) updateData.image_url = body.image_url
      if (body.features !== undefined) updateData.features = body.features
      if (body.is_active !== undefined) updateData.is_active = body.is_active
      if (body.category_id !== undefined) updateData.category_id = body.category_id
      if (body.display_order !== undefined) updateData.display_order = body.display_order
      if (body.service_type !== undefined) updateData.service_type = body.service_type
      if (body.status !== undefined) updateData.status = body.status
      // Multilingual updates
      if (body.name_en !== undefined) updateData.name_en = body.name_en
      if (body.name_ar !== undefined) updateData.name_ar = body.name_ar
      if (body.name_ru !== undefined) updateData.name_ru = body.name_ru
      if (body.description_en !== undefined) updateData.description_en = body.description_en
      if (body.description_ar !== undefined) updateData.description_ar = body.description_ar
      if (body.description_ru !== undefined) updateData.description_ru = body.description_ru

      const { data, error: updateError } = await supabaseAdmin
        .from('services')
        .update(updateData)
        .eq('id', serviceId)
        .select()
        .single()

      if (updateError) throw updateError

      await logAdminAction(supabaseAdmin, user.id, 'service_updated', serviceId, 'services', updateData)

      return jsonResponse({ 
        success: true, 
        service: data,
        message: 'Service updated successfully'
      })
    }

    // =========================================================
    // DELETE /admin-services/:id - Delete service
    // =========================================================
    if (method === 'DELETE' && serviceId && !action) {
      // Fetch service name for logging
      const { data: service, error: fetchError } = await supabaseAdmin
        .from('services')
        .select('name')
        .eq('id', serviceId)
        .maybeSingle()

      if (fetchError || !service) {
        return errorResponse('Service not found', 404)
      }

      const { error: deleteError } = await supabaseAdmin
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (deleteError) throw deleteError

      await logAdminAction(supabaseAdmin, user.id, 'service_deleted', serviceId, 'services', { 
        name: service.name 
      })

      return jsonResponse({ 
        success: true, 
        message: 'Service deleted successfully'
      })
    }

    return errorResponse('Not found', 404)

  } catch (error: any) {
    console.error('Admin services error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
