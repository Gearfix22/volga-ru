
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleExploreServices = () => {
    console.log('Navigating to services page...');
    navigate('/services');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 relative">
      {/* Main logo */}
      <div className="mb-16 fade-in-up">
        <Logo />
      </div>
      
      {/* Hero content */}
      <div className="max-w-4xl mx-auto mb-12 space-y-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 text-shadow font-serif">
          {t('welcome')}
        </h2>
        
        <p className={`text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto ${
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
          className="bg-volga-logo-blue hover:bg-volga-blue-dark text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {t('exploreServices')}
          <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'}`} />
        </Button>
      </div>
    </div>
  );
};
