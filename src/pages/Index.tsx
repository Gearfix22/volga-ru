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
      
      {/* Services Preview Section */}
      <section className="relative py-16 lg:py-24 bg-background/98 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              {t('home.ourPremiumServices')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.servicesDescription')}
            </p>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto ${isRTL ? 'md:grid-flow-dense' : ''}`}>
            <div className="text-center group">
              <div className="bg-brand-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('home.premiumTransport')}</h3>
              <p className="text-muted-foreground">{t('home.premiumTransportDesc')}</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-brand-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏨</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('home.luxuryHotels')}</h3>
              <p className="text-muted-foreground">{t('home.luxuryHotelsDesc')}</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-brand-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t('home.culturalEvents')}</h3>
              <p className="text-muted-foreground">{t('home.culturalEventsDesc')}</p>
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
