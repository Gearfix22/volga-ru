
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ServicesHeader } from '@/components/services/ServicesHeader';
import { ServicesTabs } from '@/components/services/ServicesTabs';
import { ServicesGrid } from '@/components/services/ServicesGrid';

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <ServicesHeader />
        <ServicesTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        <ServicesGrid activeCategory={activeCategory} />
      </div>
    </div>
  );
};

export default Services;
