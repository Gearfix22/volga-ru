
import React from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { HeroSection } from '@/components/HeroSection';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const Index = () => {
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
              Our Premium Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience luxury travel with our comprehensive suite of services across Russia's most beautiful destinations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="bg-brand-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Premium Transport</h3>
              <p className="text-muted-foreground">Luxury vehicles with professional drivers for comfortable journeys.</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-brand-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏨</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Luxury Hotels</h3>
              <p className="text-muted-foreground">5-star accommodations in prime locations across Russia.</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-brand-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Cultural Events</h3>
              <p className="text-muted-foreground">Exclusive access to Russia's finest cultural experiences.</p>
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
