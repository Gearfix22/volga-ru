import { BookingData, DriverBookingDetails, AccommodationDetails, EventsDetails } from '@/types/booking';
import { openExternalLink } from '@/hooks/useWebViewCompat';
// Add proper typing for payment result
interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  message: string;
}

export const sendBookingEmail = async (
  bookingData: BookingData,
  transactionId: string,
  paymentAmount: string
) => {
  
  // Format service details for email
  const formatServiceDetails = (serviceType: string, serviceDetails: any) => {
    switch (serviceType) {
      case 'Driver':
        return `
          Trip Type: ${serviceDetails.tripType || 'one-way'}
          Pickup: ${serviceDetails.pickupLocation || 'N/A'}
          Drop-off: ${serviceDetails.dropoffLocation || 'N/A'}
          Pickup Date: ${serviceDetails.pickupDate || 'N/A'}
          Pickup Time: ${serviceDetails.pickupTime || 'N/A'}
          ${serviceDetails.tripType === 'round-trip' ? `Return Date: ${serviceDetails.returnDate || 'N/A'}\n          Return Time: ${serviceDetails.returnTime || 'N/A'}` : ''}
          Vehicle Type: ${serviceDetails.vehicleType || 'N/A'}
          Passengers: ${serviceDetails.passengers || 'N/A'}
        `;
      case 'Accommodation':
        return `
          Location: ${serviceDetails.location || 'N/A'}
          Check-in: ${serviceDetails.checkIn || 'N/A'}
          Check-out: ${serviceDetails.checkOut || 'N/A'}
          Guests: ${serviceDetails.guests || 'N/A'}
          Room Preference: ${serviceDetails.roomPreference || 'Any'}
        `;
      case 'Events':
        return `
          Event Type: ${serviceDetails.eventType || 'N/A'}
          Location: ${serviceDetails.location || 'N/A'}
          Date: ${serviceDetails.date || 'N/A'}
          Number of People: ${serviceDetails.numberOfPeople || 'N/A'}
        `;
      // Legacy support
      case 'Transportation':
        return `
          Pickup: ${serviceDetails.pickup || serviceDetails.pickupLocation || 'N/A'}
          Drop-off: ${serviceDetails.dropoff || serviceDetails.dropoffLocation || 'N/A'}
          Date: ${serviceDetails.date || serviceDetails.pickupDate || 'N/A'}
          Time: ${serviceDetails.time || serviceDetails.pickupTime || 'N/A'}
          Vehicle Type: ${serviceDetails.vehicleType || 'N/A'}
        `;
      case 'Hotels':
        return `
          City: ${serviceDetails.city || serviceDetails.location || 'N/A'}
          Hotel: ${serviceDetails.hotel || 'N/A'}
          Check-in: ${serviceDetails.checkin || serviceDetails.checkIn || 'N/A'}
          Check-out: ${serviceDetails.checkout || serviceDetails.checkOut || 'N/A'}
          Room Type: ${serviceDetails.roomType || serviceDetails.roomPreference || 'N/A'}
        `;
      default:
        return 'Service details not specified';
    }
  };

  // Prepare the shared body content
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
Payment Method: ${bookingData.paymentMethod || 'Cash on Arrival'}
Total Amount: $${paymentAmount} USD

=== ADDITIONAL NOTES ===

Please process this booking and contact the customer to confirm the service arrangements.

---
Booking System
`;

  // Company email
  const companyEmailContent = {
    to: 'admin@example.com',
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
    subject: `Your Booking Confirmation - ${transactionId}`,
    body: sharedBody,
    timestamp: new Date().toISOString(),
    bookingData,
    transactionId,
    paymentAmount
  };
  
  // Store email content for demo purposes
  localStorage.setItem('lastBookingEmailCompany', JSON.stringify(companyEmailContent));
  localStorage.setItem('lastBookingEmailUser', JSON.stringify(userEmailContent));
  
  return { companyEmailContent, userEmailContent };
};

export const redirectToWhatsApp = (bookingData: BookingData, transactionId: string, paymentAmount?: number) => {
  const phoneNumber = '79522212903';
  
  const message = `Hello! I've just completed a booking.

*📋 Booking Details:*
• Transaction ID: ${transactionId}
• Service: ${bookingData.serviceType}
• Customer: ${bookingData.userInfo.fullName}
• Email: ${bookingData.userInfo.email}
• Phone: ${bookingData.userInfo.phone}
${paymentAmount ? `• Amount: $${paymentAmount.toLocaleString()} USD` : ''}
• Payment Method: ${bookingData.paymentMethod || 'Cash on Arrival'}

*🎯 Service Information:*
${formatWhatsAppServiceDetails(bookingData)}

I would like to arrange the service details and confirm payment upon arrival. Please contact me to confirm the arrangements. Thank you! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  openExternalLink(whatsappUrl);
  
  return whatsappUrl;
};

// Helper function to format service details for WhatsApp
const formatWhatsAppServiceDetails = (bookingData: BookingData) => {
  const { serviceType, serviceDetails } = bookingData;
  const details = serviceDetails as any;
  
  switch (serviceType) {
    case 'Driver':
      return `• Trip: ${details.tripType || 'one-way'}
• Pickup: ${details.pickupLocation || 'N/A'}
• Drop-off: ${details.dropoffLocation || 'N/A'}
• Date: ${details.pickupDate || 'N/A'}
• Time: ${details.pickupTime || 'N/A'}
• Vehicle: ${details.vehicleType || 'N/A'}`;
    case 'Accommodation':
      return `• Location: ${details.location || 'N/A'}
• Check-in: ${details.checkIn || 'N/A'}
• Check-out: ${details.checkOut || 'N/A'}
• Guests: ${details.guests || 'N/A'}`;
    case 'Events':
      return `• Event Type: ${details.eventType || 'N/A'}
• Location: ${details.location || 'N/A'}
• Date: ${details.date || 'N/A'}
• People: ${details.numberOfPeople || 'N/A'}`;
    // Legacy support
    case 'Transportation':
      return `• Pickup: ${details.pickup || details.pickupLocation || 'N/A'}
• Drop-off: ${details.dropoff || details.dropoffLocation || 'N/A'}
• Date: ${details.date || details.pickupDate || 'N/A'}
• Vehicle: ${details.vehicleType || 'N/A'}`;
    case 'Hotels':
      return `• Location: ${details.city || details.location || 'N/A'}
• Check-in: ${details.checkin || details.checkIn || 'N/A'}
• Check-out: ${details.checkout || details.checkOut || 'N/A'}`;
    default:
      return 'Service details not specified';
  }
};

// Credit card payment processing function
export const processCreditCardPayment = async (
  cardDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  },
  amount: number,
  bookingData: BookingData
): Promise<PaymentResult> => {

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const transactionId = `CC${Date.now()}${Math.floor(Math.random() * 1000)}`;
        resolve({
          success: true,
          transactionId,
          amount,
          message: 'Payment processed successfully'
        });
      } else {
        reject({
          success: false,
          message: 'Payment failed. Please check your card details and try again.'
        });
      }
    }, 2000);
  });
};
