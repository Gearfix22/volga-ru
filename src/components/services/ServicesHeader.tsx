
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ServicesHeader: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-12 animate-fade-in">
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 lg:p-12 mx-auto max-w-5xl hover-glass">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-shadow font-serif gradient-text">
          {t('ourServices')}
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-100 leading-relaxed max-w-4xl mx-auto">
          {t('servicesSubtitle')}
        </p>
      </div>
    </div>
  );
};
