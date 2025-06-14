
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ServicesHeader: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-12 animate-fade-in">
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-shadow-elegant font-serif">
        {t('ourServices')}
      </h1>
      
      <p className="text-xl md:text-2xl text-russian-cream leading-relaxed text-shadow-elegant max-w-4xl mx-auto">
        {t('servicesSubtitle')}
      </p>
    </div>
  );
};
