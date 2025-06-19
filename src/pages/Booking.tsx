
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { useServiceMapping } from '@/hooks/useServiceMapping';

const Booking = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const serviceFromUrl = searchParams.get('service');
  const { serviceType } = useServiceMapping(serviceFromUrl);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <BackButton className="text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('bookYourService')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {serviceType 
                ? `Complete your ${serviceType} booking details`
                : t('chooseServiceDetails')
              }
            </p>
          </div>

          <BookingWizard preSelectedService={serviceType} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Booking;
