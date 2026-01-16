import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ServicesHeader: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <header className={`text-center mb-6 sm:mb-8 lg:mb-10 animate-fade-in px-1 sm:px-2 ${isRTL ? 'rtl' : ''}`}>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 lg:mb-5 font-serif leading-tight"
          style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.7)' }}>
        {t('services.ourServices')}
      </h1>
      
      <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto px-1"
         style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)' }}>
        {t('services.servicesSubtitle')}
      </p>
    </header>
  );
};
