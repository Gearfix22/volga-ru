import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export const HeroSection: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* Hero Content */}
        <div className="text-center space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="medium" />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 font-serif leading-tight">
            {t('hero.welcome')}
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl sm:text-2xl md:text-3xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8 ${
            isRTL ? 'font-medium' : ''
          }`}>
            {t('hero.subtitle')}
          </p>
          
          {/* Primary CTA */}
          <div className="flex justify-center items-center pt-6">
            <Button
              onClick={() => navigate('/enhanced-booking')}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 active:bg-white/80 px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-100 min-h-[52px] touch-manipulation"
            >
              {t('hero.startBooking')}
              <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-8 sm:pt-12">
            {/* Mobile version - stacked */}
            <div className="flex flex-col gap-3 sm:hidden">
              <div className={`flex items-center justify-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-primary bg-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</span>
                <span className="text-sm font-semibold">{t('hero.premiumService')}</span>
              </div>
              <div className={`flex items-center justify-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-primary bg-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</span>
                <span className="text-sm font-semibold">{t('hero.multilingualSupport')}</span>
              </div>
              <div className={`flex items-center justify-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-primary bg-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</span>
                <span className="text-sm font-semibold">{t('hero.secureBooking')}</span>
              </div>
            </div>
            {/* Desktop version - horizontal */}
            <div className={`hidden sm:flex items-center justify-center gap-8 lg:gap-12 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-primary bg-white rounded-full w-7 h-7 flex items-center justify-center text-base font-bold">✓</span>
                <span className="text-base lg:text-lg font-semibold">{t('hero.premiumService')}</span>
              </div>
              <div className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-primary bg-white rounded-full w-7 h-7 flex items-center justify-center text-base font-bold">✓</span>
                <span className="text-base lg:text-lg font-semibold">{t('hero.multilingualSupport')}</span>
              </div>
              <div className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-primary bg-white rounded-full w-7 h-7 flex items-center justify-center text-base font-bold">✓</span>
                <span className="text-base lg:text-lg font-semibold">{t('hero.secureBooking')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
