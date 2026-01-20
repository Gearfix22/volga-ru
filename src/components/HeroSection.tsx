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
          
          {/* Primary CTA - Single action, result-oriented label */}
          <div className="flex justify-center items-center pt-6">
            <Button
              onClick={() => navigate('/enhanced-booking')}
              size="lg"
              className="bg-white text-brand-primary hover:bg-white/90 active:bg-white/80 px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-100 min-h-[52px] touch-manipulation"
            >
              {t('hero.startBooking')}
              <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Button>
          </div>

          {/* Feature Highlights - Visible on larger screens, replaced with simplified mobile version */}
          <div className="pt-8 sm:pt-12">
            {/* Mobile version - stacked */}
            <div className="flex flex-col gap-3 sm:hidden">
              <div className={`flex items-center justify-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-brand-accent bg-white rounded-full p-1 text-lg">✓</span>
                <span className="text-sm font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>{t('hero.premiumService')}</span>
              </div>
              <div className={`flex items-center justify-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-brand-accent bg-white rounded-full p-1 text-lg">✓</span>
                <span className="text-sm font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>{t('hero.multilingualSupport')}</span>
              </div>
              <div className={`flex items-center justify-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-brand-accent bg-white rounded-full p-1 text-lg">✓</span>
                <span className="text-sm font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>{t('hero.secureBooking')}</span>
              </div>
            </div>
            {/* Desktop version - horizontal */}
            <div className={`hidden sm:flex items-center justify-center gap-8 lg:gap-12 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
