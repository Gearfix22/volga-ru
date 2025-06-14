
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
      <div className="max-w-5xl mx-auto mb-8 sm:mb-12 space-y-6 sm:space-y-8 fade-in-up">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 text-shadow-elegant font-serif leading-tight px-2">
          {t('welcome')}
        </h2>
        
        <p className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-russian-cream leading-relaxed max-w-4xl mx-auto px-4 sm:px-6 ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('subtitle')}
        </p>

        {/* Service highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 lg:mt-12 max-w-3xl mx-auto px-2">
          <div className="flex flex-col items-center space-y-2 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-all duration-300">
            <Car className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-russian-gold" />
            <span className="text-white text-xs sm:text-sm lg:text-base font-medium text-center">Luxury Transport</span>
          </div>
          <div className="flex flex-col items-center space-y-2 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-all duration-300">
            <Star className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-russian-gold" />
            <span className="text-white text-xs sm:text-sm lg:text-base font-medium text-center">Premium Hotels</span>
          </div>
          <div className="flex flex-col items-center space-y-2 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-all duration-300">
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-russian-gold" />
            <span className="text-white text-xs sm:text-sm lg:text-base font-medium text-center">Custom Events</span>
          </div>
        </div>
      </div>
      
      {/* CTA Buttons */}
      <div className="fade-in-up flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 w-full max-w-md sm:max-w-none px-4" style={{ animationDelay: '0.4s' }}>
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="bg-russian-red hover:bg-red-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
        >
          Browse Services
          <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 ${language === 'ar' ? 'mr-2 sm:mr-3 rotate-180' : 'ml-2 sm:ml-3'}`} />
        </Button>
        
        <Button
          onClick={handleBookNow}
          variant="outline"
          size="lg"
          className="border-2 border-russian-gold text-russian-gold hover:bg-russian-gold hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
        >
          Quick Book
          <Calendar className={`h-4 w-4 sm:h-5 sm:w-5 ${language === 'ar' ? 'mr-2 sm:mr-3' : 'ml-2 sm:ml-3'}`} />
        </Button>
      </div>

      {/* Navigation hint */}
      <div className="mt-6 sm:mt-8 text-russian-cream/70 text-xs sm:text-sm max-w-xs sm:max-w-md mx-auto px-4">
        Start by browsing our services or jump directly to booking
      </div>
    </div>
  );
};
