
import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative z-10">
      {/* Logo with enhanced styling */}
      <div className="mb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-volga-logo-blue/20 to-volga-logo-red/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative">
          <Logo />
        </div>
      </div>
      
      {/* Welcome text with modern typography */}
      <div className="max-w-5xl mx-auto mb-12 animate-slide-up animation-delay-200">
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="h-6 w-6 text-volga-logo-red mr-3 animate-pulse" />
          <span className="text-volga-logo-red font-semibold text-sm uppercase tracking-widest">
            Professional Services
          </span>
          <Sparkles className="h-6 w-6 text-volga-logo-red ml-3 animate-pulse" />
        </div>
        
        <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white mb-8 text-shadow leading-tight">
          <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
            {t('welcome')}
          </span>
        </h2>
        
        <p className={`text-xl md:text-2xl lg:text-3xl text-gray-300 leading-relaxed text-shadow max-w-4xl mx-auto font-light ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          <span className="bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
            {t('subtitle')}
          </span>
        </p>
      </div>
      
      {/* Enhanced CTA Button */}
      <div className="animate-slide-up animation-delay-400 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-volga-logo-red to-red-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="relative bg-gradient-to-r from-volga-logo-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-12 py-6 text-xl rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-white/20"
        >
          <span className="flex items-center">
            {t('exploreServices')}
            <ArrowRight className={`h-6 w-6 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'} transition-transform group-hover:translate-x-1`} />
          </span>
        </Button>
      </div>
      
      {/* Enhanced decorative elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-2 h-12 bg-gradient-to-b from-volga-logo-red via-red-400 to-transparent rounded-full" />
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-volga-logo-blue rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-volga-logo-red rounded-full animate-pulse opacity-40 animation-delay-200" />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-30 animation-delay-400" />
      </div>
    </div>
  );
};
