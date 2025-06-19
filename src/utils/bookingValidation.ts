
import type { ServiceDetails, UserInfo } from '@/types/booking';

export const validateServiceDetails = (serviceType: string, serviceDetails: ServiceDetails) => {
  const details = serviceDetails as any;
  const requiredFields: { [key: string]: string[] } = {
    'Transportation': ['pickup', 'dropoff', 'date', 'time', 'vehicleType'],
    'Hotels': ['city', 'checkin', 'checkout', 'roomType'],
    'Events': ['eventName', 'eventLocation', 'eventDate', 'tickets'],
    'Custom Trips': ['duration', 'regions']
  };

  const missing = requiredFields[serviceType]?.filter(field => !details[field]) || [];
  return missing;
};

export const validateUserInfo = (userInfo: UserInfo) => {
  const errors: string[] = [];

  if (!userInfo.fullName) errors.push('Full name is required');
  if (!userInfo.email) errors.push('Email is required');
  if (!userInfo.phone) errors.push('Phone is required');

  // Validate email format
  if (userInfo.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      errors.push('Please enter a valid email address');
    }
  }

  return errors;
};

export const calculateServicePrice = (serviceType: string) => {
  const basePrices = {
    'Transportation': 50,
    'Hotels': 100,
    'Events': 75,
    'Custom Trips': 200
  };
  
  return basePrices[serviceType as keyof typeof basePrices] || 0;
};
