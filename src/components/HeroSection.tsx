
import React from 'react';
import { ArrowRight, Calendar, Star, Users, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleExploreServices = () => {
    console.log('Navigating to services page...');
    navigate('/services');
  };

  const handleBookNow = () => {
    console.log('Navigating directly to booking...');
    navigate('/booking');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 lg:px-8 relative">
      {/* Hero content */}
      <div className="max-w-4xl mx-auto mb-8 sm:mb-12 space-y-4 sm:space-y-6 fade-in-up">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 text-shadow-elegant font-serif leading-tight">
          {t('welcome')}
        </h2>
        
        <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-russian-cream leading-relaxed max-w-3xl mx-auto px-4 ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('subtitle')}
        </p>

        {/* Service highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-2xl mx-auto">
          <div className="flex flex-col items-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <Car className="h-8 w-8 text-russian-gold" />
            <span className="text-white text-sm font-medium">Luxury Transport</span>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <Star className="h-8 w-8 text-russian-gold" />
            <span className="text-white text-sm font-medium">Premium Hotels</span>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <Calendar className="h-8 w-8 text-russian-gold" />
            <span className="text-white text-sm font-medium">Custom Events</span>
          </div>
        </div>
      </div>
      
      {/* CTA Buttons */}
      <div className="fade-in-up flex flex-col sm:flex-row gap-4 sm:gap-6" style={{ animationDelay: '0.4s' }}>
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="bg-russian-red hover:bg-red-800 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Browse Services
          <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 ${language === 'ar' ? 'mr-2 sm:mr-3 rotate-180' : 'ml-2 sm:ml-3'}`} />
        </Button>
        
        <Button
          onClick={handleBookNow}
          variant="outline"
          size="lg"
          className="border-2 border-russian-gold text-russian-gold hover:bg-russian-gold hover:text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Quick Book
          <Calendar className={`h-4 w-4 sm:h-5 sm:w-5 ${language === 'ar' ? 'mr-2 sm:mr-3' : 'ml-2 sm:ml-3'}`} />
        </Button>
      </div>

      {/* Navigation hint */}
      <div className="mt-8 text-russian-cream/70 text-sm max-w-md mx-auto">
        Start by browsing our services or jump directly to booking
      </div>
    </div>
  );
};
