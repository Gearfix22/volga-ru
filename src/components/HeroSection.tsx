
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();

  const handleExploreServices = () => {
    console.log('Navigating to services page...');
    // TODO: Navigate to services page when implemented
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative z-10">
      {/* Logo */}
      <div className="mb-12">
        <Logo />
      </div>
      
      {/* Welcome text */}
      <div className="max-w-4xl mx-auto mb-8 animate-slide-up animation-delay-200">
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-shadow font-serif">
          {t('welcome')}
        </h2>
        
        <p className={`text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed text-shadow max-w-3xl mx-auto ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('subtitle')}
        </p>
      </div>
      
      {/* CTA Button */}
      <div className="animate-slide-up animation-delay-400">
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="bg-volga-gold hover:bg-volga-gold-dark text-volga-navy font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
        >
          {t('exploreServices')}
          <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
        </Button>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-1 h-8 bg-gradient-to-b from-volga-gold to-transparent rounded-full" />
      </div>
    </div>
  );
};
