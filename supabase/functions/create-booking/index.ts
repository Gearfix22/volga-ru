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

// Valid service types
const VALID_SERVICE_TYPES = ['Driver', 'Accommodation', 'Events', 'Guide'] as const;

// Validate booking payload
function validateBookingPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload.service_type || !VALID_SERVICE_TYPES.includes(payload.service_type)) {
    return { valid: false, error: `Service type must be one of: ${VALID_SERVICE_TYPES.join(', ')}` }
  }
  
  if (!payload.user_info) {
    return { valid: false, error: 'User info is required' }
  }
  
  const userInfo = payload.user_info
  if (!userInfo.fullName?.trim()) {
    return { valid: false, error: 'Full name is required' }
  }
  if (!userInfo.phone?.trim()) {
    return { valid: false, error: 'Phone number is required' }
  }
  
  return { valid: true }
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
      
      // Validate payload
      const validation = validateBookingPayload(body)
      if (!validation.valid) {
        return errorResponse(validation.error!, 400)
      }

      const { service_type, service_details, user_info, service_id, customer_notes, currency } = body

      // Build booking record
      const bookingData = {
        user_id: userId,
        service_type,
        service_id: service_id || null,
        service_details: service_details || {},
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
