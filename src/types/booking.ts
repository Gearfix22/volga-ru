// Service Types - exactly 4 services
export type ServiceType = 'Driver' | 'Accommodation' | 'Events' | 'Guide';

/**
 * FINAL BOOKING WORKFLOW:
 * 
 * 1. Customer selects service → status = 'draft', quoted_price = services.base_price
 * 2. Customer confirms (NO PAYMENT) → status = 'under_review'
 * 3. Admin reviews and sets price → admin_final_price set, status = 'awaiting_customer_confirmation'
 * 4. Customer confirms price → proceeds to payment
 * 5. Payment successful → paid_price = admin_final_price, payment_status = 'paid', status = 'paid'
 * 6. Admin assigns driver/guide → status = 'in_progress'
 * 7. Service completed → status = 'completed'
 */
export type BookingStatus = 
  | 'draft'                         // Customer selecting service
  | 'under_review'                  // Customer confirmed, waiting for admin review
  | 'awaiting_customer_confirmation' // Admin set price, waiting for customer
  | 'paid'                          // Customer paid
  | 'in_progress'                   // Driver/guide assigned, service ongoing
  | 'completed'                     // Service completed
  | 'cancelled'                     // Cancelled by admin or customer
  | 'rejected';                     // Rejected by admin

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
  quoted_price?: number;          // Initial price from services.base_price
  admin_final_price?: number;     // Admin-set price (source of truth for payments)
  paid_price?: number;            // Amount actually paid
  totalPrice?: number;            // Legacy field - use admin_final_price instead
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

// Pricing rules - services.base_price is reference only
export const SERVICE_PRICING = {
  Driver: {
    basePrice: 50, // USD minimum reference
    hasFixedPrice: true,
    adminCanEdit: true
  },
  Accommodation: {
    basePrice: 0, // Admin sets price
    hasFixedPrice: false,
    adminCanEdit: true,
    requiresAdminPricing: true
  },
  Events: {
    basePrice: 0, // Admin sets price
    hasFixedPrice: false,
    adminCanEdit: true,
    requiresAdminPricing: true
  },
  Guide: {
    basePrice: 50, // USD per hour reference
    hasFixedPrice: false,
    adminCanEdit: true,
    requiresAdminPricing: true
  }
} as const;

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
