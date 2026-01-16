// Re-export ServiceType from central location to avoid duplication
import type { ServiceType } from '@/types/service';
export type { ServiceType };

/**
 * FINAL BOOKING WORKFLOW (Aligned with Database ENUM):
 * 
 * 1. Customer selects service → status = 'draft'
 * 2. Customer confirms (NO PAYMENT) → status = 'pending' or 'under_review'
 * 3. Admin reviews and sets price → status = 'approved' or 'awaiting_payment'
 * 4. Customer pays → status = 'paid'
 * 5. Admin assigns driver/guide → status = 'confirmed' then 'assigned'
 * 6. Driver accepts → status = 'accepted'
 * 7. Trip starts → status = 'on_trip'
 * 8. Service completed → status = 'completed'
 * 
 * PRICING: booking_prices.admin_price is the ONLY payable price
 * 
 * DATABASE ENUM values (source of truth):
 * draft, pending, under_review, approved, awaiting_payment, paid, 
 * confirmed, assigned, accepted, on_trip, completed, cancelled, rejected
 */
export type BookingStatus = 
  | 'draft'                // Customer selecting service
  | 'pending'              // Customer submitted, waiting for admin review
  | 'under_review'         // Admin is reviewing the booking
  | 'approved'             // Admin approved, price may be set
  | 'awaiting_payment'     // Price set and locked, waiting for payment
  | 'paid'                 // Customer paid
  | 'confirmed'            // Payment confirmed, ready for assignment
  | 'assigned'             // Driver/guide assigned
  | 'accepted'             // Driver/guide accepted the assignment
  | 'on_trip'              // Service in progress
  | 'completed'            // Service completed
  | 'cancelled'            // Cancelled by admin or customer
  | 'rejected';            // Rejected by admin

// CLASSIFICATION HELPERS - ALIGNED WITH DATABASE
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'draft', 'pending', 'under_review', 'approved', 'awaiting_payment', 
  'paid', 'confirmed', 'assigned', 'accepted', 'on_trip'
];

export const COMPLETED_BOOKING_STATUSES: BookingStatus[] = ['completed'];

export const CANCELLED_BOOKING_STATUSES: BookingStatus[] = ['cancelled', 'rejected'];

export const FINAL_BOOKING_STATUSES: BookingStatus[] = ['completed', 'cancelled', 'rejected'];

// Statuses that indicate user can pay
export const PAYABLE_STATUSES: BookingStatus[] = ['awaiting_payment', 'approved'];

// Statuses that show booking is actively being worked on
export const IN_PROGRESS_STATUSES: BookingStatus[] = ['assigned', 'accepted', 'on_trip'];

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
  serviceId?: string | null; // FK reference to services table
  serviceDetails: ServiceDetails;
  userInfo: UserInfo;
  // Dynamic pricing from services table
  totalPrice?: number;
  currency?: string;
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
