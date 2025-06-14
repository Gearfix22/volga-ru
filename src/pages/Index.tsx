
import React from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { HeroSection } from '@/components/HeroSection';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <HeroSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
