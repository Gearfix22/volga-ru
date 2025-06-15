
import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Track form started when component mounts
    trackForm('booking', 'started', {
      serviceType,
      timestamp: new Date().toISOString()
    });
  }, [trackForm, serviceType]);

  useEffect(() => {
    // Track form progress when service details change
    if (Object.keys(serviceDetails).length > 0) {
      trackForm('booking', 'field_changed', {
        serviceType,
        serviceDetails,
        field: 'service_details'
      }, 'service_details');
    }
  }, [trackForm, serviceType, serviceDetails]);

  useEffect(() => {
    // Track user info changes
    if (userInfo.fullName || userInfo.email || userInfo.phone) {
      trackForm('booking', 'field_changed', {
        serviceType,
        userInfo: {
          hasName: !!userInfo.fullName,
          hasEmail: !!userInfo.email,
          hasPhone: !!userInfo.phone,
          language: userInfo.language
        },
        field: 'user_info'
      }, 'user_info');
    }
  }, [trackForm, serviceType, userInfo]);

  return <>{children}</>;
};
