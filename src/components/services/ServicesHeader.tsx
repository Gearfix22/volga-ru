import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ServicesHeader: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <header className={`text-center mb-6 sm:mb-8 animate-fade-in px-2 ${isRTL ? 'rtl' : ''}`}>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-2 sm:mb-3 leading-tight"
          style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)' }}>
        {t('services.ourServices')}
      </h1>
      
      <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto"
         style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>
        {t('services.servicesSubtitle')}
      </p>
    </header>
  );
};
