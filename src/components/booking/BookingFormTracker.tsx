
import React, { useEffect, useMemo } from 'react';
import { useDataTracking } from '@/hooks/useDataTracking';

interface BookingFormTrackerProps {
  serviceType: string;
  serviceDetails: any;
  userInfo: any;
  children: React.ReactNode;
}

export const BookingFormTracker: React.FC<BookingFormTrackerProps> = ({
  serviceType,
  serviceDetails,
  userInfo,
  children
}) => {
  const { trackForm } = useDataTracking();

  // Memoize service details to prevent unnecessary re-renders
  const memoizedServiceDetails = useMemo(() => serviceDetails, [
    JSON.stringify(serviceDetails)
  ]);

  // Memoize user info to prevent unnecessary re-renders  
  const memoizedUserInfo = useMemo(() => userInfo, [
    userInfo.fullName,
    userInfo.email, 
    userInfo.phone,
    userInfo.language
  ]);

  useEffect(() => {
    // Track form started only once when component mounts
    trackForm('booking', 'started', {
      serviceType,
      timestamp: new Date().toISOString()
    });
  }, [trackForm, serviceType]);

  useEffect(() => {
    // Track form progress when service details change (throttled)
    const hasServiceDetails = Object.keys(memoizedServiceDetails).length > 0;
    if (hasServiceDetails) {
      const timeoutId = setTimeout(() => {
        trackForm('booking', 'field_changed', {
          serviceType,
          serviceDetails: memoizedServiceDetails,
          field: 'service_details'
        }, 'service_details');
      }, 500); // Debounce by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [trackForm, serviceType, memoizedServiceDetails]);

  useEffect(() => {
    // Track user info changes (throttled)
    const hasUserInfo = memoizedUserInfo.fullName || memoizedUserInfo.email || memoizedUserInfo.phone;
    if (hasUserInfo) {
      const timeoutId = setTimeout(() => {
        trackForm('booking', 'field_changed', {
          serviceType,
          userInfo: {
            hasName: !!memoizedUserInfo.fullName,
            hasEmail: !!memoizedUserInfo.email,
            hasPhone: !!memoizedUserInfo.phone,
            language: memoizedUserInfo.language
          },
          field: 'user_info'
        }, 'user_info');
      }, 500); // Debounce by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [trackForm, serviceType, memoizedUserInfo]);

  return <>{children}</>;
};
