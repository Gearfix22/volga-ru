import React from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { HeroSection } from '@/components/HeroSection';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="relative min-h-screen brand-gradient">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <HeroSection />
      
      {/* Services Preview Section - Cleaner app style */}
      <section className="relative py-12 lg:py-16 bg-background/98 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">
              {t('home.ourPremiumServices')}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {t('home.servicesDescription')}
            </p>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto ${isRTL ? 'md:grid-flow-dense' : ''}`}>
            <div className="text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🚗</span>
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">{t('home.premiumTransport')}</h3>
              <p className="text-sm text-muted-foreground">{t('home.premiumTransportDesc')}</p>
            </div>
            
            <div className="text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🏨</span>
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">{t('home.luxuryHotels')}</h3>
              <p className="text-sm text-muted-foreground">{t('home.luxuryHotelsDesc')}</p>
            </div>
            
            <div className="text-center p-4 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🎭</span>
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">{t('home.culturalEvents')}</h3>
              <p className="text-sm text-muted-foreground">{t('home.culturalEventsDesc')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
