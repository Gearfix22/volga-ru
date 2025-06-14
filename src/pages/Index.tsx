
import React from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { HeroSection } from '@/components/HeroSection';

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>
      
      {/* Main Content */}
      <HeroSection />
    </div>
  );
};

export default Index;
