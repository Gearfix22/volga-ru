
import React, { useState } from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ServicesHeader } from '@/components/services/ServicesHeader';
import { ServicesTabs } from '@/components/services/ServicesTabs';
import { ServicesGrid } from '@/components/services/ServicesGrid';
import { BookingProgress } from '@/components/BookingProgress';

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="relative z-10 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BookingProgress />
          <ServicesHeader />
          <ServicesTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          <ServicesGrid activeCategory={activeCategory} />
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Services;
