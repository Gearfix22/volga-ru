
import { BookingData } from '@/types/booking';

export const sendBookingEmail = async (bookingData: BookingData, transactionId: string, paymentAmount: string) => {
  console.log('Preparing to send booking email to info@volgaservices.com:', {
    bookingData,
    transactionId,
    paymentAmount
  });
  
  // Format service details for email
  const formatServiceDetails = (serviceType: string, serviceDetails: any) => {
    switch (serviceType) {
      case 'Transportation':
        return `
          Pickup: ${serviceDetails.pickup || 'N/A'}
          Drop-off: ${serviceDetails.dropoff || 'N/A'}
          Date: ${serviceDetails.date || 'N/A'}
          Time: ${serviceDetails.time || 'N/A'}
          Vehicle Type: ${serviceDetails.vehicleType || 'N/A'}
        `;
      case 'Hotels':
        return `
          City: ${serviceDetails.city || 'N/A'}
          Hotel: ${serviceDetails.hotel || 'N/A'}
          Check-in: ${serviceDetails.checkin || 'N/A'}
          Check-out: ${serviceDetails.checkout || 'N/A'}
          Room Type: ${serviceDetails.roomType || 'N/A'}
        `;
      case 'Events':
        return `
          Event Name: ${serviceDetails.eventName || 'N/A'}
          Location: ${serviceDetails.eventLocation || 'N/A'}
          Date: ${serviceDetails.eventDate || 'N/A'}
          Tickets: ${serviceDetails.tickets || 'N/A'}
        `;
      case 'Custom Trips':
        return `
          Duration: ${serviceDetails.duration || 'N/A'}
          Regions: ${serviceDetails.regions || 'N/A'}
          Interests: ${serviceDetails.interests ? serviceDetails.interests.join(', ') : 'N/A'}
        `;
      default:
        return 'Service details not specified';
    }
  };

  const emailContent = {
    to: 'info@volgaservices.com',
    subject: `New Booking Confirmation - ${transactionId}`,
    body: `
=== NEW BOOKING CONFIRMATION ===

Transaction ID: ${transactionId}
Payment Amount: $${paymentAmount} USD
Booking Date: ${new Date().toLocaleString()}

=== SERVICE INFORMATION ===
Service Type: ${bookingData.serviceType}
${formatServiceDetails(bookingData.serviceType, bookingData.serviceDetails)}

=== CUSTOMER INFORMATION ===
Name: ${bookingData.userInfo.fullName}
Email: ${bookingData.userInfo.email}
Phone: ${bookingData.userInfo.phone}
Preferred Language: ${bookingData.userInfo.language}

=== PAYMENT DETAILS ===
Payment Method: ${bookingData.paymentMethod || 'Not specified'}
Total Amount Paid: $${paymentAmount} USD
${bookingData.totalPrice ? `Original Price: $${bookingData.totalPrice}` : ''}

=== ADDITIONAL NOTES ===
${bookingData.customAmount ? `Custom amount was entered: $${bookingData.customAmount}` : ''}

Please process this booking and contact the customer to confirm the service arrangements.

---
Volga Services Booking System
    `,
    timestamp: new Date().toISOString(),
    bookingData: bookingData,
    transactionId: transactionId,
    paymentAmount: paymentAmount
  };
  
  // TODO: This will be implemented once Supabase is connected
  // For now, we're logging the email content that would be sent
  console.log('Email content prepared for info@volgaservices.com:');
  console.log('Subject:', emailContent.subject);
  console.log('Body:', emailContent.body);
  
  // Store email data in localStorage for development purposes
  localStorage.setItem('lastBookingEmail', JSON.stringify(emailContent));
  
  return emailContent;
};

export const redirectToWhatsApp = (bookingData: BookingData, transactionId: string) => {
  const phoneNumber = '7XXXXXXXXXX'; // Replace with actual WhatsApp business number
  
  // Create WhatsApp message with booking details
  const message = `Hello! I've just completed a booking with Volga Services.
  
Transaction ID: ${transactionId}
Service: ${bookingData.serviceType}
Customer: ${bookingData.userInfo.fullName}
Email: ${bookingData.userInfo.email}
Phone: ${bookingData.userInfo.phone}

I would like to confirm my booking details. Thank you!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  // Open WhatsApp in a new tab
  window.open(whatsappUrl, '_blank');
};
