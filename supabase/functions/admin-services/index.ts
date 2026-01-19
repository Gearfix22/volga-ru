/**
 * ADMIN-SERVICES EDGE FUNCTION
 * 
 * Full CRUD operations for services - ADMIN ONLY
 * Mobile-compatible, API-first design
 * 
 * DYNAMIC SERVICE TYPES:
 * - No hardcoded service type restrictions
 * - Admin can create any service type
 * - Types are validated against existing or created as new
 * 
 * Endpoints:
 * GET    /admin-services              - List all services
 * GET    /admin-services/:id          - Get specific service
 * GET    /admin-services/:id/inputs   - Get service inputs
 * POST   /admin-services              - Create new service
 * PUT    /admin-services/:id          - Update service
 * DELETE /admin-services/:id          - Delete service
 * POST   /admin-services/:id/toggle   - Toggle active status
 * POST   /admin-services/reorder      - Bulk reorder services
 * POST   /admin-services/:id/inputs   - Create/update service inputs
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

// Validate service payload - NO HARDCODED TYPES
function validateServicePayload(payload: any, isCreate: boolean = true): { valid: boolean; error?: string } {
  if (isCreate) {
    if (!payload.name?.trim()) {
      return { valid: false, error: 'Service name is required' }
    }
    if (!payload.type?.trim()) {
      return { valid: false, error: 'Service type is required' }
    }
    // NO HARDCODED TYPE VALIDATION - any type is allowed
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

// Create default inputs for a new service based on common patterns
async function createDefaultInputs(supabaseAdmin: any, serviceId: string, serviceType: string) {
  // Common inputs that most services need
  const commonInputs = [
    {
      service_id: serviceId,
      input_key: 'specialRequests',
      label: 'Special Requests',
      label_en: 'Special Requests',
      label_ar: 'طلبات خاصة',
      label_ru: 'Особые пожелания',
      input_type: 'textarea',
      is_required: false,
      display_order: 99,
      placeholder: 'Any special requirements...'
    }
  ]

  // Add a date input as it's commonly needed
  commonInputs.unshift({
    service_id: serviceId,
    input_key: 'preferredDate',
    label: 'Preferred Date',
    label_en: 'Preferred Date',
    label_ar: 'التاريخ المفضل',
    label_ru: 'Предпочтительная дата',
    input_type: 'date',
    is_required: true,
    display_order: 1,
    placeholder: ''
  })

  await supabaseAdmin
    .from('service_inputs')
    .insert(commonInputs)
    .then(() => {})
    .catch((e: any) => console.warn('Failed to create default inputs:', e))
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

      // Also get unique service types for dropdown
      const uniqueTypes = [...new Set((data || []).map((s: any) => s.type))]

      return jsonResponse({ 
        success: true,
        services: data,
        service_types: uniqueTypes,
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
    // GET /admin-services/:id/inputs - Get service inputs
    // =========================================================
    if (method === 'GET' && serviceId && action === 'inputs') {
      const { data, error } = await supabaseAdmin
        .from('service_inputs')
        .select('*')
        .eq('service_id', serviceId)
        .order('display_order', { ascending: true })

      if (error) throw error

      return jsonResponse({ 
        success: true, 
        inputs: data || [],
        count: data?.length || 0
      })
    }

    // =========================================================
    // POST /admin-services/:id/inputs - Create/update service inputs
    // =========================================================
    if (method === 'POST' && serviceId && action === 'inputs') {
      const body = await req.json()
      const { inputs } = body

      if (!Array.isArray(inputs)) {
        return errorResponse('Inputs must be an array', 400)
      }

      // Delete existing inputs and replace with new ones
      await supabaseAdmin
        .from('service_inputs')
        .delete()
        .eq('service_id', serviceId)

      if (inputs.length > 0) {
        const inputsWithServiceId = inputs.map((input: any, index: number) => ({
          ...input,
          service_id: serviceId,
          display_order: input.display_order ?? index
        }))

        const { error } = await supabaseAdmin
          .from('service_inputs')
          .insert(inputsWithServiceId)

        if (error) throw error
      }

      await logAdminAction(supabaseAdmin, user.id, 'service_inputs_updated', serviceId, 'service_inputs', { 
        count: inputs.length 
      })

      return jsonResponse({ 
        success: true, 
        message: `${inputs.length} inputs saved`
      })
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

      // Also fetch inputs for this service
      const { data: inputs } = await supabaseAdmin
        .from('service_inputs')
        .select('*')
        .eq('service_id', serviceId)
        .order('display_order', { ascending: true })

      return jsonResponse({ 
        success: true, 
        service: data,
        inputs: inputs || []
      })
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
        type: body.type.trim(), // DYNAMIC - any type allowed
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
        // Scheduling fields
        duration_minutes: body.duration_minutes || null,
        availability_days: body.availability_days || null,
        available_from: body.available_from || null,
        available_to: body.available_to || null,
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

      // Create default inputs for the new service
      await createDefaultInputs(supabaseAdmin, data.id, data.type)

      await logAdminAction(supabaseAdmin, user.id, 'service_created', data.id, 'services', { 
        name: data.name,
        type: data.type 
      })

      return jsonResponse({ 
        success: true, 
        service: data,
        message: 'Service created successfully. Default inputs added - customize them in service settings.'
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
      if (body.type !== undefined) updateData.type = body.type.trim() // DYNAMIC - any type allowed
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
      // Scheduling fields
      if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes
      if (body.availability_days !== undefined) updateData.availability_days = body.availability_days
      if (body.available_from !== undefined) updateData.available_from = body.available_from
      if (body.available_to !== undefined) updateData.available_to = body.available_to
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