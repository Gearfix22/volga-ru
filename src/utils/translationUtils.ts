/**
 * Translation utilities for mapping database values to i18n keys
 * and handling dynamic translations
 */

// Status mapping for bookings
export const getStatusTranslationKey = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'status.pending',
    'confirmed': 'status.confirmed',
    'completed': 'status.completed',
    'cancelled': 'status.cancelled',
    'rejected': 'status.rejected',
    'assigned': 'status.assigned',
    'accepted': 'status.accepted',
    'on_trip': 'status.onTrip',
    'on_the_way': 'status.onTheWay',
  };
  return statusMap[status?.toLowerCase()] || 'status.unknown';
};

// Payment status mapping
export const getPaymentStatusTranslationKey = (status: string): string => {
  const paymentStatusMap: Record<string, string> = {
    'pending': 'paymentStatus.pending',
    'paid': 'paymentStatus.paid',
    'failed': 'paymentStatus.failed',
    'refunded': 'paymentStatus.refunded',
    'awaiting_verification': 'paymentStatus.awaitingVerification',
  };
  return paymentStatusMap[status?.toLowerCase()] || 'paymentStatus.unknown';
};

// Service type mapping
export const getServiceTypeTranslationKey = (serviceType: string): string => {
  const serviceTypeMap: Record<string, string> = {
    'transportation': 'serviceTypes.transportation',
    'driver': 'serviceTypes.driver',
    'hotel': 'serviceTypes.hotel',
    'accommodation': 'serviceTypes.accommodation',
    'event': 'serviceTypes.event',
    'events': 'serviceTypes.events',
    'custom_trip': 'serviceTypes.customTrip',
    'guide': 'serviceTypes.guide',
  };
  return serviceTypeMap[serviceType?.toLowerCase()] || 'serviceTypes.unknown';
};

// Vehicle type mapping
export const getVehicleTypeTranslationKey = (vehicleType: string): string => {
  const vehicleMap: Record<string, string> = {
    'sedan': 'vehicleTypes.sedan',
    'suv': 'vehicleTypes.suv',
    'minivan': 'vehicleTypes.minivan',
    'bus': 'vehicleTypes.bus',
    'luxury': 'vehicleTypes.luxury',
    'economy': 'vehicleTypes.economy',
  };
  return vehicleMap[vehicleType?.toLowerCase()] || 'vehicleTypes.unknown';
};

// Room type mapping
export const getRoomTypeTranslationKey = (roomType: string): string => {
  const roomMap: Record<string, string> = {
    'single': 'roomTypes.single',
    'double': 'roomTypes.double',
    'suite': 'roomTypes.suite',
    'family': 'roomTypes.family',
    'deluxe': 'roomTypes.deluxe',
  };
  return roomMap[roomType?.toLowerCase()] || 'roomTypes.unknown';
};

// Role mapping
export const getRoleTranslationKey = (role: string): string => {
  const roleMap: Record<string, string> = {
    'admin': 'roles.admin',
    'moderator': 'roles.moderator',
    'user': 'roles.user',
    'driver': 'roles.driver',
    'guide': 'roles.guide',
  };
  return roleMap[role?.toLowerCase()] || 'roles.unknown';
};

// Payment method mapping
export const getPaymentMethodTranslationKey = (method: string): string => {
  const methodMap: Record<string, string> = {
    'credit_card': 'paymentMethods.creditCard',
    'bank_transfer': 'paymentMethods.bankTransfer',
    'paypal': 'paymentMethods.paypal',
    'cash': 'paymentMethods.cash',
    'cash_on_arrival': 'paymentMethods.cashOnArrival',
  };
  return methodMap[method?.toLowerCase()] || 'paymentMethods.unknown';
};

// Log missing translation keys for admin review
export const logMissingTranslation = (key: string, language: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[i18n] Missing translation: "${key}" for language "${language}"`);
  }
  
  // Store in localStorage for admin review
  try {
    const missingKeys = JSON.parse(localStorage.getItem('missingTranslations') || '{}');
    if (!missingKeys[language]) {
      missingKeys[language] = [];
    }
    if (!missingKeys[language].includes(key)) {
      missingKeys[language].push(key);
      localStorage.setItem('missingTranslations', JSON.stringify(missingKeys));
    }
  } catch (e) {
    // Silently fail if localStorage is not available
  }
};

// Get missing translations for admin review
export const getMissingTranslations = (): Record<string, string[]> => {
  try {
    return JSON.parse(localStorage.getItem('missingTranslations') || '{}');
  } catch (e) {
    return {};
  }
};

// Clear missing translations log
export const clearMissingTranslations = (): void => {
  try {
    localStorage.removeItem('missingTranslations');
  } catch (e) {
    // Silently fail
  }
};
