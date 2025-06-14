
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ServicesHeader: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-12 animate-fade-in">
      <div className="mb-6">
        <p className="text-pearl-white/80 text-sm sm:text-base font-medium tracking-wider uppercase mb-4">
          PREMIUM TRAVEL SOLUTIONS
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-pearl-white mb-6 elegant-shadow">
          {t('ourServices')}
        </h1>
      </div>
      
      <p className="text-xl md:text-2xl text-ocean-light/85 leading-relaxed elegant-shadow max-w-4xl mx-auto">
        {t('servicesSubtitle')}
      </p>
    </div>
  );
};
