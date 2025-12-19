// Service Types - exactly 3 services
export type ServiceType = 'Driver' | 'Accommodation' | 'Events';

// Unified booking status flow
/**
 * NORMALIZED BOOKING LIFECYCLE:
 * pending (REQUESTED) → confirmed (ADMIN_REVIEW) → assigned (DRIVER_ASSIGNED) 
 * → accepted (DRIVER_CONFIRMED) → on_trip (IN_PROGRESS) → completed → paid/closed
 */
export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'accepted' | 'on_trip' | 'completed' | 'paid' | 'cancelled' | 'rejected';

// Payment methods
export type PaymentMethod = 'visa' | 'cash';

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
  customAmount?: number;
  totalPrice?: number;
  paymentMethod?: PaymentMethod | string;
  transactionId?: string;
  paidAmount?: number;
  status?: BookingStatus | string;
  driverRequired?: boolean;
}

// Legacy type aliases for backward compatibility
export type TransportationDetails = DriverBookingDetails;
export type HotelDetails = AccommodationDetails;
export type EventDetails = EventsDetails;
export type TripDetails = Record<string, unknown>;

// Pricing rules
export const SERVICE_PRICING = {
  Driver: {
    basePrice: 50, // USD minimum
    hasFixedPrice: true,
    adminCanEdit: true
  },
  Accommodation: {
    basePrice: 0, // No fixed price
    hasFixedPrice: false,
    adminCanEdit: true,
    requiresAdminPricing: true
  },
  Events: {
    basePrice: 0, // No fixed price
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
