
import { BookingData } from '@/types/booking';

export const sendBookingEmail = async (bookingData: BookingData, transactionId: string, paymentAmount: string) => {
  // This will be implemented once Supabase is connected
  console.log('Booking email would be sent to info@volgaservices.com:', {
    bookingData,
    transactionId,
    paymentAmount
  });
  
  // TODO: Implement email sending via Supabase edge function
  // Example structure for the email:
  const emailData = {
    to: 'info@volgaservices.com',
    subject: `New Booking Confirmation - ${transactionId}`,
    booking: bookingData,
    transactionId,
    paymentAmount,
    timestamp: new Date().toISOString()
  };
  
  return emailData;
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
