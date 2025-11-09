
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleExploreServices = () => {
    navigate('/services');
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Main Content Container */}
      <div className="w-full max-w-5xl mx-auto">
        {/* Hero Content */}
        <div className="text-center space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="medium" />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 font-serif leading-tight drop-shadow-lg">
            {t('common.welcome')}
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl sm:text-2xl md:text-3xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8 drop-shadow-md ${
            language === 'ar' ? 'font-medium' : ''
          }`}>
            {t('common.subtitle')}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              onClick={handleExploreServices}
              size="lg"
              className="bg-white text-brand-primary hover:bg-white/90 px-8 py-6 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              {t('common.exploreServices')}
              <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'}`} />
            </Button>
            
            <Button
              onClick={() => navigate('/enhanced-booking')}
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-brand-primary px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              {t('common.bookNow')}
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-12 hidden md:block">
            <div className="flex items-center justify-center gap-8 lg:gap-12">
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-medium">{t('common.premiumService')}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-medium">{t('common.multilingualSupport')}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-medium">{t('common.secureBooking')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
