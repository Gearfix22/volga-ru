
export interface TransportationDetails {
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  vehicleType: string;
  passengers?: string;
}

export interface HotelDetails {
  city: string;
  hotel: string;
  checkin: string;
  checkout: string;
  roomType: string;
  guests?: string;
  specialRequests?: string;
}

export interface EventDetails {
  eventName: string;
  eventLocation: string;
  eventDate: string;
  tickets: string;
  ticketType?: string;
}

export interface TripDetails {
  duration: string;
  regions: string;
  interests: string[];
  budget?: string;
  additionalInfo?: string;
}

export type ServiceDetails = TransportationDetails | HotelDetails | EventDetails | TripDetails | {};

export interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  language: string;
}

export interface BookingData {
  serviceType: string;
  serviceDetails: ServiceDetails;
  userInfo: UserInfo;
  customAmount?: number;
  totalPrice?: number;
  paymentMethod?: string;
  transactionId?: string;
  paidAmount?: number;
}
