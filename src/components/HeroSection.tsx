
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
      {/* Dark Overlay for Text Visibility */}
      <div className="absolute inset-0 bg-black/50"></div>
      
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
            Welcome to Volga Voyage
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl sm:text-2xl md:text-3xl text-white leading-relaxed max-w-3xl mx-auto mb-8 ${
            language === 'ar' ? 'font-medium' : ''
          }`}
             style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.7)' }}>
            Discover Premium Travel Services with Personalized Excellence
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              onClick={handleExploreServices}
              size="lg"
              className="bg-white text-brand-primary hover:bg-white/90 px-8 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              View Our Services
              <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'}`} />
            </Button>
            
            <Button
              onClick={() => navigate('/enhanced-booking')}
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-brand-primary px-8 py-6 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105"
            >
              Book Appointment
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-12 hidden md:block">
            <div className="flex items-center justify-center gap-8 lg:gap-12">
              <div className="flex items-center gap-2 text-white">
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>Premium Service</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>Multilingual Support</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="text-brand-accent bg-white rounded-full p-1 text-xl">✓</span>
                <span className="text-base lg:text-lg font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}>Secure Booking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
