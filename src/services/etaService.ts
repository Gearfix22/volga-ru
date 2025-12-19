import { getMapboxToken } from './locationService';

export interface ETAResult {
  duration: number; // seconds
  distance: number; // meters
  durationText: string;
  distanceText: string;
}

export const calculateETA = async (
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number
): Promise<ETAResult | null> => {
  try {
    const token = await getMapboxToken();
    if (!token) {
      console.error('No Mapbox token available');
      return null;
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${token}&overview=false`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Mapbox directions API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const durationSeconds = route.duration;
      const distanceMeters = route.distance;

      return {
        duration: durationSeconds,
        distance: distanceMeters,
        durationText: formatDuration(durationSeconds),
        distanceText: formatDistance(distanceMeters),
      };
    }

    return null;
  } catch (error) {
    console.error('ETA calculation error:', error);
    return null;
  }
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return 'Less than 1 min';
  }
  
  const minutes = Math.round(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

// Parse destination from booking service details
export const getDestinationFromBooking = (
  serviceType: string,
  serviceDetails: any
): { lat: number; lng: number } | null => {
  // Common patterns for destination locations
  if (!serviceDetails) return null;

  // For transportation bookings
  if (serviceType === 'transportation' || serviceType === 'airport_transfer') {
    if (serviceDetails.dropoff_coordinates) {
      return {
        lat: serviceDetails.dropoff_coordinates.lat,
        lng: serviceDetails.dropoff_coordinates.lng,
      };
    }
    // Try to geocode dropoff_location if coordinates not available
    // This would require additional API call
  }

  // For hotel bookings - destination is the hotel
  if (serviceType === 'hotel' && serviceDetails.hotel_coordinates) {
    return {
      lat: serviceDetails.hotel_coordinates.lat,
      lng: serviceDetails.hotel_coordinates.lng,
    };
  }

  // For event bookings - destination is the event venue
  if (serviceType === 'event' && serviceDetails.venue_coordinates) {
    return {
      lat: serviceDetails.venue_coordinates.lat,
      lng: serviceDetails.venue_coordinates.lng,
    };
  }

  return null;
};
