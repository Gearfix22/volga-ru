
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ServicesHeader: React.FC = () => {
  const { t } = useLanguage();

  return (
    <header className="text-center mb-6 sm:mb-8 lg:mb-10 animate-fade-in px-1 sm:px-2">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 lg:mb-5 text-shadow-elegant font-serif leading-tight">
        {t('services.ourServices')}
      </h1>
      
      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-coastal-pearl leading-relaxed text-shadow-elegant max-w-3xl mx-auto px-1">
        {t('services.servicesSubtitle')}
      </p>
    </header>
  );
};
