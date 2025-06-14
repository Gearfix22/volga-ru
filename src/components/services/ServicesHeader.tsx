
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ServicesHeader: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="text-center mb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToHome')}
        </Button>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-shadow font-serif">
        {t('ourServices')}
      </h1>
      
      <p className="text-xl md:text-2xl text-gray-200 leading-relaxed text-shadow max-w-4xl mx-auto">
        {t('servicesSubtitle')}
      </p>
    </div>
  );
};
