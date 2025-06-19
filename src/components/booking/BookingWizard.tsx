
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';
import { useDataTracking } from '@/hooks/useDataTracking';
import { createDraftBooking } from '@/services/database';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { ServiceDetailsForm } from './ServiceDetailsForm';
import { PricingDisplay } from './PricingDisplay';
import { ContactInformationForm } from './ContactInformationForm';
import { BookingFormTracker } from './BookingFormTracker';
import { BookingSubmitButton } from './BookingSubmitButton';
import type { ServiceDetails, UserInfo } from '@/types/booking';

interface BookingWizardProps {
  preSelectedService?: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ preSelectedService }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { trackForm } = useDataTracking();
  
  const [serviceType, setServiceType] = useState(preSelectedService || '');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>({});
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: '',
    language: 'english'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateServiceDetail = (key: string, value: string | string[]) => {
    setServiceDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateUserInfo = (key: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateForm = () => {
    if (!serviceType) {
      toast({
        title: t('serviceRequired'),
        description: t('pleaseSelectService'),
        variant: "destructive"
      });
      return false;
    }

    // Validate required service details
    const details = serviceDetails as any;
    const requiredFields: { [key: string]: string[] } = {
      'Transportation': ['pickup', 'dropoff', 'date', 'time', 'vehicleType'],
      'Hotels': ['city', 'checkin', 'checkout', 'roomType'],
      'Events': ['eventName', 'eventLocation', 'eventDate', 'tickets'],
      'Custom Trips': ['duration', 'regions']
    };

    const missing = requiredFields[serviceType]?.filter(field => !details[field]) || [];
    
    if (missing.length > 0) {
      toast({
        title: "Missing Required Information",
        description: `Please fill in: ${missing.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      toast({
        title: t('contactInfoRequired'),
        description: t('fillRequiredFields'),
        variant: "destructive"
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const calculatePrice = () => {
    const basePrices = {
      'Transportation': 50,
      'Hotels': 100,
      'Events': 75,
      'Custom Trips': 200
    };
    
    return basePrices[serviceType as keyof typeof basePrices] || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      trackForm('booking', 'abandoned', {
        serviceType,
        serviceDetails,
        userInfo,
        reason: 'validation_failed'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalPrice = calculatePrice();
      const bookingData = {
        serviceType,
        serviceDetails,
        userInfo,
        totalPrice
      };

      console.log('Creating draft booking with data:', bookingData);

      const draftBooking = await createDraftBooking(bookingData);

      console.log('Draft booking created:', draftBooking);

      trackForm('booking', 'submitted', {
        serviceType,
        totalPrice,
        hasAllRequiredFields: true,
        bookingId: draftBooking.id
      });

      localStorage.setItem('bookingData', JSON.stringify({
        ...bookingData,
        draftBookingId: draftBooking.id
      }));

      toast({
        title: "Booking Draft Saved",
        description: "Your booking has been saved. Complete payment to confirm.",
      });

      navigate('/payment', {
        state: { 
          bookingData: {
            ...bookingData,
            draftBookingId: draftBooking.id
          }
        }
      });

    } catch (error) {
      console.error('Error creating draft booking:', error);
      toast({
        title: "Error Saving Booking",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
      
      trackForm('booking', 'abandoned', {
        serviceType,
        serviceDetails,
        userInfo,
        reason: 'draft_booking_failed',
        error: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BookingFormTracker
      serviceType={serviceType}
      serviceDetails={serviceDetails}
      userInfo={userInfo}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <ServiceTypeSelector
          serviceType={serviceType}
          onSelectService={setServiceType}
          preSelected={!!preSelectedService}
        />

        {serviceType && (
          <>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {serviceType} Details
              </h2>
              <ServiceDetailsForm
                serviceType={serviceType}
                serviceDetails={serviceDetails}
                onUpdateDetail={updateServiceDetail}
              />
            </div>

            <PricingDisplay
              serviceType={serviceType}
              serviceDetails={serviceDetails}
            />
          </>
        )}

        <ContactInformationForm
          userInfo={userInfo}
          onUpdateUserInfo={updateUserInfo}
        />

        <BookingSubmitButton
          serviceType={serviceType}
          userInfo={userInfo}
          isSubmitting={isSubmitting}
        />
      </form>
    </BookingFormTracker>
  );
};
