/**
 * Hook for translating dynamic values from database (statuses, types, etc.)
 * This ensures all database-driven values are properly translated
 */

import { useTranslation } from 'react-i18next';
import {
  getStatusTranslationKey,
  getPaymentStatusTranslationKey,
  getServiceTypeTranslationKey,
  getVehicleTypeTranslationKey,
  getRoomTypeTranslationKey,
  getRoleTranslationKey,
  getPaymentMethodTranslationKey,
} from '@/utils/translationUtils';

export const useTranslatedValue = () => {
  const { t } = useTranslation('common');

  /**
   * Translate a booking status
   */
  const translateStatus = (status: string): string => {
    if (!status) return t('common.unknown');
    const key = getStatusTranslationKey(status);
    return t(key);
  };

  /**
   * Translate a payment status
   */
  const translatePaymentStatus = (status: string): string => {
    if (!status) return t('common.unknown');
    const key = getPaymentStatusTranslationKey(status);
    return t(key);
  };

  /**
   * Translate a service type
   */
  const translateServiceType = (serviceType: string): string => {
    if (!serviceType) return t('common.unknown');
    const key = getServiceTypeTranslationKey(serviceType);
    return t(key);
  };

  /**
   * Translate a vehicle type
   */
  const translateVehicleType = (vehicleType: string): string => {
    if (!vehicleType) return t('common.unknown');
    const key = getVehicleTypeTranslationKey(vehicleType);
    return t(key);
  };

  /**
   * Translate a room type
   */
  const translateRoomType = (roomType: string): string => {
    if (!roomType) return t('common.unknown');
    const key = getRoomTypeTranslationKey(roomType);
    return t(key);
  };

  /**
   * Translate a user role
   */
  const translateRole = (role: string): string => {
    if (!role) return t('common.unknown');
    const key = getRoleTranslationKey(role);
    return t(key);
  };

  /**
   * Translate a payment method
   */
  const translatePaymentMethod = (method: string): string => {
    if (!method) return t('common.unknown');
    const key = getPaymentMethodTranslationKey(method);
    return t(key);
  };

  /**
   * Generic translation helper - tries to find a translation key
   * Falls back to the original value if not found
   */
  const translateDynamic = (value: string, prefix?: string): string => {
    if (!value) return '';
    
    // Build the key with optional prefix
    const key = prefix ? `${prefix}.${value}` : value;
    const translated = t(key);
    
    // If translation equals key, it wasn't found - return original value
    if (translated === key) {
      return value;
    }
    
    return translated;
  };

  /**
   * Translate notification type
   */
  const translateNotificationType = (type: string): string => {
    if (!type) return t('common.unknown');
    const typeMap: Record<string, string> = {
      'new_booking': 'notifications.types.newBooking',
      'booking_update': 'notifications.types.bookingUpdate',
      'driver_assigned': 'notifications.types.driverAssigned',
      'driver_arrival': 'notifications.types.driverArrival',
      'trip_complete': 'notifications.types.tripComplete',
      'payment': 'notifications.types.payment',
      'new_assignment': 'notifications.types.newAssignment',
      'status_change': 'notifications.types.statusChange',
    };
    const key = typeMap[type] || 'notifications.types.general';
    return t(key);
  };

  /**
   * Translate error messages from API/Supabase
   */
  const translateError = (error: string): string => {
    if (!error) return t('errors.unknown');
    
    // Common error message mappings
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'errors.invalidCredentials',
      'Email not confirmed': 'errors.emailNotConfirmed',
      'User already registered': 'errors.userExists',
      'Email already registered': 'errors.emailExists',
      'Phone number already registered': 'errors.phoneExists',
      'Invalid email or password': 'errors.invalidCredentials',
      'Password is too weak': 'errors.weakPassword',
      'Rate limit exceeded': 'errors.rateLimitExceeded',
      'Network error': 'errors.networkError',
      'Session expired': 'errors.sessionExpired',
      'Unauthorized': 'errors.unauthorized',
      'Forbidden': 'errors.forbidden',
      'Not found': 'errors.notFound',
      'Server error': 'errors.serverError',
    };
    
    // Try exact match first
    if (errorMap[error]) {
      return t(errorMap[error]);
    }
    
    // Try partial matches
    for (const [key, value] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return t(value);
      }
    }
    
    // Return original error if no translation found
    return error;
  };

  return {
    translateStatus,
    translatePaymentStatus,
    translateServiceType,
    translateVehicleType,
    translateRoomType,
    translateRole,
    translatePaymentMethod,
    translateNotificationType,
    translateError,
    translateDynamic,
    t, // Also expose the raw t function for direct translations
  };
};

export default useTranslatedValue;
