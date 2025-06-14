
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
      {/* Main logo with glass effect */}
      <div className="mb-8 sm:mb-12 lg:mb-16 fade-in-up">
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 hover-glass">
          <Logo variant="dark" />
        </div>
      </div>
      
      {/* Hero content with glass morphism */}
      <div className="max-w-4xl mx-auto mb-8 sm:mb-12 space-y-4 sm:space-y-6 fade-in-up liquid-glass rounded-3xl p-6 sm:p-8 lg:p-12" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 text-shadow font-serif leading-tight gradient-text">
          {t('welcome')}
        </h2>
        
        <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 leading-relaxed max-w-3xl mx-auto px-4 ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('subtitle')}
        </p>
      </div>
      
      {/* CTA Button with liquid glass effect */}
      <div className="fade-in-up" style={{ animationDelay: '0.4s' }}>
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="liquid-glass-button text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-2xl relative overflow-hidden group"
        >
          <span className="absolute inset-0 shimmer"></span>
          <span className="relative z-10 flex items-center">
            {t('exploreServices')}
            <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 ${language === 'ar' ? 'mr-2 sm:mr-3 rotate-180' : 'ml-2 sm:ml-3'} transition-transform group-hover:translate-x-1`} />
          </span>
        </Button>
      </div>
      
      {/* Floating glass elements */}
      <div className="absolute top-1/4 left-10 w-4 h-4 liquid-glass rounded-full floating opacity-60" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-16 w-6 h-6 liquid-glass rounded-full floating opacity-40" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 liquid-glass rounded-full floating opacity-50" style={{ animationDelay: '3s' }}></div>
    </div>
  );
};
