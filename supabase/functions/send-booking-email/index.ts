/**
 * SEND-BOOKING-EMAIL EDGE FUNCTION
 * 
 * Sends booking confirmation emails using Resend.
 * Uses shared auth middleware for consistent security.
 * 
 * Security: Requires admin role OR the booking must belong to the authenticated user.
 */

import { 
  corsHeaders, 
  jsonResponse, 
  errorResponse, 
  handleCors,
  getAuthContext,
  hasRole
} from '../_shared/auth.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

interface BookingEmailRequest {
  bookingId?: string
  userInfo: {
    fullName: string
    email: string
    phone: string
  }
  serviceType: string
  serviceDetails: any
  transactionId: string
  totalPrice: number
  paymentMethod: string
  status: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Require authentication
    const authResult = await getAuthContext(req)
    if (authResult instanceof Response) return authResult
    
    const { userId, roles, supabaseAdmin, user } = authResult
    const isAdmin = hasRole(roles, 'admin')

    const bookingData: BookingEmailRequest = await req.json()

    // If not admin, verify user owns this booking (if bookingId provided)
    if (!isAdmin && bookingData.bookingId) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('user_id')
        .eq('id', bookingData.bookingId)
        .maybeSingle()

      if (!booking || booking.user_id !== userId) {
        return errorResponse('Forbidden: You can only send emails for your own bookings', 403)
      }
    }

    // Validate required fields
    if (!bookingData.userInfo?.email) {
      return errorResponse('Email address is required', 400)
    }

    // If not admin and no bookingId, user can only send to their own email
    if (!isAdmin && !bookingData.bookingId) {
      if (bookingData.userInfo.email !== user.email) {
        return errorResponse('Forbidden: Can only send to your own email', 403)
      }
    }

    const renderServiceDetails = (serviceType: string, details: any) => {
      switch (serviceType) {
        case 'Transportation':
          return `
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="color: #1e293b; margin-bottom: 12px;">Transportation Details</h3>
              <p><strong>Pickup:</strong> ${details.pickup || 'N/A'}</p>
              <p><strong>Drop-off:</strong> ${details.dropoff || 'N/A'}</p>
              <p><strong>Date:</strong> ${details.date || 'N/A'}</p>
              <p><strong>Time:</strong> ${details.time || 'N/A'}</p>
              <p><strong>Vehicle Type:</strong> ${details.vehicleType || 'N/A'}</p>
              ${details.passengers ? `<p><strong>Passengers:</strong> ${details.passengers}</p>` : ''}
            </div>
          `
        case 'Hotels':
          return `
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="color: #1e293b; margin-bottom: 12px;">Hotel Details</h3>
              <p><strong>Hotel:</strong> ${details.hotel || 'N/A'}</p>
              <p><strong>City:</strong> ${details.city || 'N/A'}</p>
              <p><strong>Check-in:</strong> ${details.checkin || 'N/A'}</p>
              <p><strong>Check-out:</strong> ${details.checkout || 'N/A'}</p>
              <p><strong>Room Type:</strong> ${details.roomType || 'N/A'}</p>
              ${details.guests ? `<p><strong>Guests:</strong> ${details.guests}</p>` : ''}
            </div>
          `
        case 'Events':
          return `
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="color: #1e293b; margin-bottom: 12px;">Event Details</h3>
              <p><strong>Event:</strong> ${details.eventName || 'N/A'}</p>
              <p><strong>Location:</strong> ${details.eventLocation || 'N/A'}</p>
              <p><strong>Date:</strong> ${details.eventDate || 'N/A'}</p>
              <p><strong>Tickets:</strong> ${details.tickets || 'N/A'}</p>
              ${details.ticketType ? `<p><strong>Ticket Type:</strong> ${details.ticketType}</p>` : ''}
            </div>
          `
        case 'Custom Trips':
          return `
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="color: #1e293b; margin-bottom: 12px;">Trip Details</h3>
              <p><strong>Duration:</strong> ${details.duration || 'N/A'}</p>
              <p><strong>Regions:</strong> ${details.regions || 'N/A'}</p>
              ${details.interests ? `<p><strong>Interests:</strong> ${details.interests.join(', ')}</p>` : ''}
              ${details.budget ? `<p><strong>Budget:</strong> ${details.budget}</p>` : ''}
            </div>
          `
        default:
          return `<p>Service details not available</p>`
      }
    }

    const getStatusBadge = (status: string) => {
      // ALIGNED WITH DATABASE ENUM - booking_status
      const colors: Record<string, string> = {
        'draft': '#6b7280',
        'pending': '#eab308',
        'under_review': '#3b82f6',
        'approved': '#16a34a',
        'awaiting_payment': '#eab308',
        'paid': '#16a34a',
        'confirmed': '#16a34a',
        'assigned': '#8b5cf6',
        'accepted': '#16a34a',
        'on_trip': '#3b82f6',
        'completed': '#059669',
        'cancelled': '#dc2626',
        'rejected': '#dc2626',
        'pending_verification': '#eab308',
        'failed': '#dc2626'
      }
      return `<span style="background: ${colors[status] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${status.replace(/_/g, ' ').toUpperCase()}</span>`
    }

    const emailResponse = await resend.emails.send({
      from: 'Volga Services <bookings@volgaservices.com>',
      to: [bookingData.userInfo.email],
      subject: `Booking Confirmation - ${bookingData.serviceType} Service`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e293b; margin-bottom: 10px;">🎉 Booking Confirmed!</h1>
            <p style="color: #64748b; font-size: 18px;">Thank you for choosing Volga Services</p>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin: 0;">Booking Details</h2>
              ${getStatusBadge(bookingData.status)}
            </div>
            
            <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
              <p><strong>Service:</strong> ${bookingData.serviceType}</p>
              <p><strong>Customer:</strong> ${bookingData.userInfo.fullName}</p>
              <p><strong>Email:</strong> ${bookingData.userInfo.email}</p>
              <p><strong>Phone:</strong> ${bookingData.userInfo.phone}</p>
            </div>

            ${renderServiceDetails(bookingData.serviceType, bookingData.serviceDetails || {})}

            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 16px;">
              <h3 style="color: #1e293b; margin-bottom: 12px;">Payment Information</h3>
              <p><strong>Payment Method:</strong> ${bookingData.paymentMethod}</p>
              <p><strong>Total Amount:</strong> $${(bookingData.totalPrice || 0).toFixed(2)}</p>
              <p><strong>Transaction ID:</strong> ${bookingData.transactionId}</p>
            </div>
          </div>

          <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #1e40af; margin-top: 0;">What happens next?</h3>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li>Our team will contact you within 24 hours to confirm details</li>
              <li>You will receive service updates via email and WhatsApp</li>
              ${bookingData.paymentMethod === 'Cash on Arrival' ? 
                '<li>Please prepare the exact cash amount for your service</li>' : ''}
              ${bookingData.status === 'pending_verification' ? 
                '<li>We are verifying your payment and will confirm once processed</li>' : ''}
            </ul>
          </div>

          <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <p style="margin-bottom: 16px;"><strong>Need help or have questions?</strong></p>
            <p style="margin: 8px 0;">📞 Phone: +7 952 221-29-03</p>
            <p style="margin: 8px 0;">✉️ Email: info@volgaservices.com</p>
            <p style="margin: 8px 0;">💬 WhatsApp: <a href="https://wa.me/79522212903" target="_blank" rel="noopener noreferrer" style="color: #16a34a; text-decoration: none;">Click to chat</a></p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>Thank you for trusting Volga Services with your travel needs!</p>
            <p>© ${new Date().getFullYear()} Volga Services. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    })

    console.log(`Booking email sent to ${bookingData.userInfo.email} by user ${userId}`)

    return jsonResponse({ success: true, emailResponse })
  } catch (error: any) {
    console.error('Error in send-booking-email function:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
