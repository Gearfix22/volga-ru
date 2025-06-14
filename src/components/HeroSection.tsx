
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
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 lg:px-8 relative">
      {/* Main logo */}
      <div className="mb-8 sm:mb-12 lg:mb-16 fade-in-up">
        <Logo />
      </div>
      
      {/* Hero content */}
      <div className="max-w-5xl mx-auto mb-8 sm:mb-12 space-y-6 sm:space-y-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="mb-4 sm:mb-6">
          <p className="text-luxury-cream/90 text-sm sm:text-base font-medium tracking-wider uppercase mb-4">
            LUXURY TRAVEL SERVICES
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 sm:mb-8 elegant-shadow leading-tight">
            Experience Premium
            <br />
            <span className="luxury-text">Travel Excellence</span>
          </h1>
        </div>
        
        <p className={`text-lg sm:text-xl md:text-2xl text-luxury-cream/80 leading-relaxed max-w-4xl mx-auto px-4 elegant-shadow ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('subtitle')}
        </p>
      </div>
      
      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 fade-in-up" style={{ animationDelay: '0.4s' }}>
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="bg-ocean-500 hover:bg-ocean-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-0"
        >
          {t('exploreServices')}
          <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'}`} />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="glass-effect text-white border-white/30 hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
        >
          Learn More
        </Button>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 fade-in-up" style={{ animationDelay: '0.6s' }}>
        <div className="flex flex-col items-center text-white/60">
          <span className="text-sm mb-2">Scroll Down</span>
          <div className="w-px h-16 bg-white/20 relative">
            <div className="absolute top-0 w-px h-4 bg-white/60 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
