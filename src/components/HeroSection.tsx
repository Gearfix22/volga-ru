
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleExploreServices = () => {
    navigate('/services');
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 lg:px-8 relative">
      {/* Hero content */}
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 text-shadow-elegant font-serif leading-tight">
          {t('common.welcome')}
        </h1>
        
        <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('common.subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            onClick={handleExploreServices}
            size="lg"
            className="bg-brand-secondary hover:bg-brand-secondary/90 text-brand-secondary-foreground px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('common.exploreServices')}
            <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'}`} />
          </Button>
          
          <Button
            onClick={() => navigate('/enhanced-booking')}
            variant="outline"
            size="lg"
            className="border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-brand-accent-foreground px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
          >
            {t('common.bookNow')}
          </Button>
        </div>
      </div>
      
      {/* Features highlight */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center space-x-6 text-muted-foreground text-sm">
          <span className="flex items-center">
            ✓ {t('common.premiumService')}
          </span>
          <span className="flex items-center">
            ✓ {t('common.multilingualSupport')}
          </span>
          <span className="flex items-center">
            ✓ {t('common.secureBooking')}
          </span>
        </div>
      </div>
    </main>
  );
};
