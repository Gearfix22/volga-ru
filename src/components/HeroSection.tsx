
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';
import { Button } from '@/components/ui/button';

export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleExploreServices = () => {
    console.log('Navigating to services page...');
    navigate('/services');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-3 sm:px-6 lg:px-8 xl:px-12 relative">
      {/* Hero content */}
      <div className="max-w-6xl mx-auto mb-6 sm:mb-8 lg:mb-12 space-y-3 sm:space-y-4 lg:space-y-6 fade-in-up">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 text-shadow-elegant font-serif leading-tight px-1 sm:px-2">
          {t('welcome')}
        </h2>
        
        <p className={`text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-russian-cream leading-relaxed max-w-3xl mx-auto px-1 sm:px-2 ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('subtitle')}
        </p>
      </div>
      
      {/* CTA Button */}
      <div className="fade-in-up" style={{ animationDelay: '0.4s' }}>
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="bg-russian-red hover:bg-red-800 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 text-sm sm:text-base lg:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-auto min-w-[180px] sm:min-w-[220px]"
        >
          {t('exploreServices')}
          <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 ${language === 'ar' ? 'mr-2 sm:mr-3 rotate-180' : 'ml-2 sm:ml-3'}`} />
        </Button>
      </div>
    </div>
  );
};
