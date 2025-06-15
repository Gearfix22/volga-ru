
import { BookingData } from '@/types/booking';

export const sendBookingEmail = async (
  bookingData: BookingData,
  transactionId: string,
  paymentAmount: string
) => {
  console.log('Preparing to send booking email to info@volgaservices.com AND to user:', {
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

  // Prepare the shared body content, always including the phone number
  const sharedBody = `
=== BOOKING CONFIRMATION RECEIPT ===

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
`;

  // Company email
  const companyEmailContent = {
    to: 'info@volgaservices.com',
    subject: `New Booking Confirmation - ${transactionId}`,
    body: sharedBody,
    timestamp: new Date().toISOString(),
    bookingData,
    transactionId,
    paymentAmount
  };

  // User email
  const userEmailContent = {
    to: bookingData.userInfo.email,
    subject: `Your Booking Confirmation - Volga Services - ${transactionId}`,
    body: sharedBody,
    timestamp: new Date().toISOString(),
    bookingData,
    transactionId,
    paymentAmount
  };
  
  // Simulate sending both emails (company and user)
  console.log('Email content prepared for company:', companyEmailContent);
  localStorage.setItem('lastBookingEmailCompany', JSON.stringify(companyEmailContent));
  
  console.log('Email content prepared for user:', userEmailContent);
  localStorage.setItem('lastBookingEmailUser', JSON.stringify(userEmailContent));
  
  return { companyEmailContent, userEmailContent };
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

