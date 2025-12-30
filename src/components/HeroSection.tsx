import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export const HeroSection: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleExploreServices = () => {
    navigate('/services');
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Gradient Overlay for Text Visibility - WCAG AA Compliant */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" aria-hidden="true"></div>
      
      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* Hero Content */}
        <div className="text-center space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="medium" />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 font-serif leading-tight" 
              style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.7)' }}>
            {t('hero.welcome')}
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl sm:text-2xl md:text-3xl text-white leading-relaxed max-w-3xl mx-auto mb-8 ${
            isRTL ? 'font-medium' : ''
          }`}
             style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.7)' }}>
            {t('hero.subtitle')}
          </p>
          
          {/* CTA Button - Simplified */}
          <div className="flex justify-center items-center pt-6">
            <Button
              onClick={() => navigate('/enhanced-booking')}
              size="lg"
              className="bg-white text-brand-primary hover:bg-white/90 px-10 py-7 text-xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              {t('hero.bookAppointment')}
              <ArrowRight className={`h-6 w-6 ${isRTL ? 'mr-3 rotate-180' : 'ml-3'}`} />
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-12 hidden md:block">
            <div className={`flex items-center justify-center gap-8 lg:gap-12 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>{t('hero.premiumService')}</span>
              </div>
              <div className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>{t('hero.multilingualSupport')}</span>
              </div>
              <div className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>{t('hero.secureBooking')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
