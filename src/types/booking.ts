
export interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  language: string;
}

export interface ServiceDetails {
  // Transportation
  pickup?: string;
  dropoff?: string;
  date?: string;
  time?: string;
  vehicleType?: string;
  passengers?: string;
  
  // Hotels
  city?: string;
  hotel?: string;
  checkin?: string;
  checkout?: string;
  roomType?: string;
  guests?: string;
  specialRequests?: string;
  
  // Events
  eventName?: string;
  eventLocation?: string;
  eventDate?: string;
  tickets?: string;
  ticketType?: string;
  
  // Custom Trips
  duration?: string;
  regions?: string;
  interests?: string[];
  budget?: string;
  additionalInfo?: string;
}

export interface BookingData {
  serviceType: string;
  serviceDetails: ServiceDetails;
  userInfo: UserInfo;
}
