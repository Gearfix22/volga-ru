// Service Types - exactly 4 services
export type ServiceType = 'Driver' | 'Accommodation' | 'Events' | 'Guide';

/**
 * FINAL BOOKING WORKFLOW:
 * 
 * 1. Customer selects service → status = 'draft'
 * 2. Customer confirms (NO PAYMENT) → status = 'pending_admin'
 * 3. Admin reviews and sets price in booking_prices table → status = 'price_set'
 * 4. Customer confirms price → status = 'awaiting_payment'
 * 5. Payment successful → status = 'paid'
 * 6. Admin assigns driver/guide → status = 'in_progress'
 * 7. Service completed → status = 'completed'
 * 
 * PRICING: booking_prices.admin_price is the ONLY payable price
 */
export type BookingStatus = 
  | 'draft'                   // Customer selecting service
  | 'pending_admin'           // Customer confirmed, waiting for admin to set price
  | 'price_set'               // Admin set price in booking_prices
  | 'awaiting_payment'        // Customer confirmed price, ready to pay
  | 'paid'                    // Customer paid
  | 'in_progress'             // Driver/guide assigned, service ongoing
  | 'completed'               // Service completed
  | 'cancelled'               // Cancelled by admin or customer
  | 'rejected';               // Rejected by admin

// Payment methods
export type PaymentMethod = 'visa' | 'cash' | 'bank_transfer';

// Payment status
export type PaymentStatus = 'pending' | 'awaiting_payment' | 'paid' | 'refunded';

// Driver booking details (one-way or round trip)
export interface DriverBookingDetails {
  tripType: 'one-way' | 'round-trip';
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string; // For round trips
  returnTime?: string;
  passengers: string;
  vehicleType: string;
  specialRequests?: string;
}

// Accommodation booking details
export interface AccommodationDetails {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  roomPreference?: string;
  specialRequests?: string;
}

// Events & Entertainment details
export interface EventsDetails {
  eventType: 'circus' | 'balloon' | 'museum' | 'park' | 'cabin' | 'city-tour' | 'cable-car' | 'opera' | 'other';
  eventName?: string;
  location: string;
  date: string;
  numberOfPeople: string;
  specialRequests?: string;
}

export type ServiceDetails = DriverBookingDetails | AccommodationDetails | EventsDetails | Record<string, unknown>;

export interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  language: string;
}

export interface BookingData {
  serviceType: ServiceType | string;
  serviceDetails: ServiceDetails;
  userInfo: UserInfo;
  // PRICING: Only booking_prices.admin_price is used for payment
  // These fields are for display only, not used in payment logic
  paymentMethod?: PaymentMethod | string;
  transactionId?: string;
  status?: BookingStatus | string;
  payment_status?: PaymentStatus | string;
  driverRequired?: boolean;
}

// Legacy type aliases for backward compatibility
export type TransportationDetails = DriverBookingDetails;
export type HotelDetails = AccommodationDetails;
export type EventDetails = EventsDetails;
export type TripDetails = Record<string, unknown>;

// Event types for Events & Entertainment service
export const EVENT_TYPES = [
  { id: 'circus', label: 'Circus' },
  { id: 'balloon', label: 'Hot Air Balloon' },
  { id: 'museum', label: 'Museums' },
  { id: 'park', label: 'Parks & Theme Parks' },
  { id: 'cabin', label: 'Cabins & Retreats' },
  { id: 'city-tour', label: 'City Tours' },
  { id: 'cable-car', label: 'Cable Car' },
  { id: 'opera', label: 'Opera & Theater' },
  { id: 'other', label: 'Other' }
] as const;
