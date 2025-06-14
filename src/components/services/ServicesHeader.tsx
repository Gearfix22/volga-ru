
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ServicesHeader: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-8 sm:mb-10 lg:mb-12 animate-fade-in px-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 text-shadow-elegant font-serif leading-tight">
        {t('ourServices')}
      </h1>
      
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-russian-cream leading-relaxed text-shadow-elegant max-w-4xl mx-auto px-2">
        {t('servicesSubtitle')}
      </p>
    </div>
  );
};
