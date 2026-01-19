/**
 * CREATE-BOOKING EDGE FUNCTION
 * 
 * User creates a booking - this is the ONLY way to create bookings via API
 * Mobile-compatible, API-first design
 * 
 * WORKFLOW:
 * 1. User submits booking request
 * 2. Booking created with status 'under_review'
 * 3. Admin reviews and sets price (via admin-bookings/set-price)
 * 4. Customer confirms and pays
 * 
 * DYNAMIC SERVICE TYPES:
 * - No hardcoded service types
 * - Validates against active services in database
 * - Fetches required inputs from service_inputs table
 * 
 * POST /create-booking - Create new booking
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext,
  AuthContext
} from '../_shared/auth.ts'

// Validate booking payload with comprehensive checks - NO HARDCODED SERVICE TYPES
async function validateBookingPayload(
  supabaseAdmin: any,
  payload: any
): Promise<{ valid: boolean; error?: string; serviceData?: any }> {
  // Validate service_type exists
  if (!payload.service_type) {
    return { valid: false, error: 'Service type is required' }
  }
  
  // DYNAMIC VALIDATION: Check if service_type exists in database
  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, type, name, is_active')
    .or(`type.eq.${payload.service_type},id.eq.${payload.service_id || '00000000-0000-0000-0000-000000000000'}`)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (serviceError) {
    console.error('Service validation error:', serviceError)
    return { valid: false, error: 'Failed to validate service type' }
  }

  // If no service found, check if it's a new/custom type (allow it but log)
  if (!service) {
    console.warn(`Service type '${payload.service_type}' not found in active services - allowing as custom type`)
  }
  
  // Validate user info exists
  if (!payload.user_info) {
    return { valid: false, error: 'User info is required' }
  }
  
  const userInfo = payload.user_info
  
  // Validate required user info fields
  if (!userInfo.fullName?.trim()) {
    return { valid: false, error: 'Full name is required' }
  }
  if (userInfo.fullName.length > 100) {
    return { valid: false, error: 'Full name must be less than 100 characters' }
  }
  if (!userInfo.phone?.trim()) {
    return { valid: false, error: 'Phone number is required' }
  }
  
  // Validate service_details against required inputs from database
  const details = payload.service_details || {}
  
  // Fetch required inputs for this service (if service exists)
  if (service) {
    const { data: requiredInputs } = await supabaseAdmin
      .from('service_inputs')
      .select('input_key, label, is_required')
      .eq('service_id', service.id)
      .eq('is_required', true)
      .eq('is_active', true)

    if (requiredInputs && requiredInputs.length > 0) {
      for (const input of requiredInputs) {
        if (!details[input.input_key] && details[input.input_key] !== 0) {
          return { valid: false, error: `${input.label} is required` }
        }
      }
    }
  }
  
  // Date validation: prevent past dates for common date fields
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const dateFields = ['pickupDate', 'checkIn', 'date', 'departureDate', 'tourDate', 'eventDate']
  for (const field of dateFields) {
    if (details[field]) {
      const fieldDate = new Date(details[field])
      if (fieldDate < today) {
        return { valid: false, error: `${field.replace(/([A-Z])/g, ' $1').trim()} cannot be in the past` }
      }
    }
  }
  
  // Check-out must be after check-in
  if (details.checkIn && details.checkOut) {
    const checkIn = new Date(details.checkIn)
    const checkOut = new Date(details.checkOut)
    if (checkOut <= checkIn) {
      return { valid: false, error: 'Check-out date must be after check-in date' }
    }
  }
  
  return { valid: true, serviceData: service }
}

// Check for duplicate recent booking (within 1 minute) - prevent accidental double submission
async function checkDuplicateBooking(
  supabaseAdmin: any,
  userId: string,
  serviceType: string
): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
  
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('user_id', userId)
    .eq('service_type', serviceType)
    .gte('created_at', oneMinuteAgo)
    .limit(1)
  
  return data && data.length > 0
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require authentication
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId, supabaseAdmin } = authResult as AuthContext
    const method = req.method

    // =========================================================
    // POST /create-booking - Create new booking
    // =========================================================
    if (method === 'POST') {
      const body = await req.json()
      
      // Validate payload with dynamic service type checking
      const validation = await validateBookingPayload(supabaseAdmin, body)
      if (!validation.valid) {
        return errorResponse(validation.error!, 400)
      }

      const { service_type, service_details, user_info, service_id, customer_notes, currency } = body
      const serviceData = validation.serviceData

      // Check for duplicate submission within 1 minute
      const isDuplicate = await checkDuplicateBooking(supabaseAdmin, userId, service_type)
      if (isDuplicate) {
        console.warn(`Duplicate booking attempt blocked for user ${userId}`)
        return errorResponse('A similar booking was recently submitted. Please wait before trying again.', 429)
      }

      // Build booking record with service snapshot
      const bookingData = {
        user_id: userId,
        service_type,
        service_id: service_id || serviceData?.id || null,
        service_details: {
          ...service_details,
          // Store service snapshot for audit trail
          _service_snapshot: serviceData ? {
            id: serviceData.id,
            name: serviceData.name,
            type: serviceData.type
          } : null
        },
        user_info: {
          fullName: user_info.fullName.trim(),
          email: user_info.email?.trim() || null,
          phone: user_info.phone.trim(),
          language: user_info.language || 'en'
        },
        status: 'under_review', // Immediately goes to admin review
        payment_status: 'pending',
        currency: currency || 'USD',
        customer_notes: customer_notes || null,
        total_price: null, // NEVER set by user - admin sets this via booking_prices
        driver_required: service_type === 'Driver',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert booking
      const { data: booking, error: insertError } = await supabaseAdmin
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()

      if (insertError) {
        console.error('Create booking error:', insertError)
        return errorResponse(`Failed to create booking: ${insertError.message}`, 500)
      }

      // Store individual user inputs for structured querying
      if (service_details && typeof service_details === 'object') {
        const userInputs = Object.entries(service_details)
          .filter(([key]) => !key.startsWith('_')) // Skip internal fields
          .map(([key, value]) => ({
            booking_id: booking.id,
            input_key: key,
            input_value: String(value)
          }))

        if (userInputs.length > 0) {
          await supabaseAdmin
            .from('booking_user_inputs')
            .insert(userInputs)
            .then(() => {})
            .catch((e: any) => console.warn('Failed to store user inputs:', e))
        }
      }

      // Initialize booking_prices record (price will be set by admin)
      const { error: priceError } = await supabaseAdmin
        .from('booking_prices')
        .insert({
          booking_id: booking.id,
          amount: 0, // Placeholder - admin will set actual price
          admin_price: null, // Admin has not set price yet
          currency: currency || 'USD',
          tax: 0,
          locked: false // Price is not locked until admin sets it
        })

      if (priceError) {
        console.error('Create booking_prices error:', priceError)
        // Don't fail the booking - prices can be created later
      }

      // Record initial status in history
      await supabaseAdmin.from('booking_status_history').insert({
        booking_id: booking.id,
        old_status: null,
        new_status: 'under_review',
        changed_by: userId,
        notes: 'Booking created by customer'
      })

      // Notify admins
      await supabaseAdmin.from('unified_notifications').insert({
        recipient_type: 'admin',
        recipient_id: '00000000-0000-0000-0000-000000000000', // Placeholder for all admins
        type: 'new_booking',
        title: 'New Booking Request',
        message: `New ${service_type} booking from ${user_info.fullName}`,
        booking_id: booking.id
      })

      // Log user activity
      await supabaseAdmin.from('user_activities').insert({
        user_id: userId,
        activity_type: 'booking_created',
        activity_data: { booking_id: booking.id, service_type },
        activity_description: `Created ${service_type} booking`
      })

      return jsonResponse({ 
        success: true, 
        booking: {
          id: booking.id,
          status: booking.status,
          service_type: booking.service_type,
          created_at: booking.created_at
        },
        message: 'Booking created successfully. Awaiting admin review and pricing.'
      }, 201)
    }

    return errorResponse('Method not allowed', 405)

  } catch (error: any) {
    console.error('Create booking error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})