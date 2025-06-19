
import React from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';

const Gallery = () => {
  const { t } = useLanguage();

  const landmarks = [
    {
      id: 1,
      name: 'Red Square',
      location: 'Moscow',
      image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop',
      description: 'The iconic heart of Moscow and Russia'
    },
    {
      id: 2,
      name: 'St. Basil\'s Cathedral',
      location: 'Moscow',
      image: 'https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800&h=600&fit=crop',
      description: 'Colorful onion domes and unique architecture'
    },
    {
      id: 3,
      name: 'Kremlin Palace',
      location: 'Moscow',
      image: 'https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=800&h=600&fit=crop',
      description: 'The historic fortress and seat of power'
    },
    {
      id: 4,
      name: 'Hermitage Museum',
      location: 'St. Petersburg',
      image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop',
      description: 'One of the world\'s largest art galleries'
    },
    {
      id: 5,
      name: 'Peterhof Palace',
      location: 'St. Petersburg',
      image: 'https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800&h=600&fit=crop',
      description: 'The Russian Versailles with magnificent fountains'
    },
    {
      id: 6,
      name: 'Golden Ring Churches',
      location: 'Moscow Region',
      image: 'https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=800&h=600&fit=crop',
      description: 'Ancient towns with traditional Russian architecture'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="relative z-10 pt-10 sm:pt-12 lg:pt-14 xl:pt-16 pb-4 sm:pb-6 lg:pb-8">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 font-serif leading-tight px-1">
              <span className="kremlin-text">GALLERY</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-russian-cream max-w-3xl mx-auto px-1 leading-relaxed">
              Discover the magnificent landmarks and architectural wonders of Russia
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {landmarks.map((landmark) => (
              <Card 
                key={landmark.id} 
                className="group overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={landmark.image}
                    alt={landmark.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
                    <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-0.5 leading-tight">{landmark.name}</h3>
                    <p className="text-russian-cream text-xs sm:text-sm">{landmark.location}</p>
                  </div>
                </div>
                <CardContent className="p-2 sm:p-3">
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{landmark.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-6 sm:mt-8 lg:mt-10">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-5 lg:p-6 max-w-3xl mx-auto">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 font-serif leading-tight">
                Experience These Landmarks
              </h2>
              <p className="text-russian-cream mb-3 sm:mb-4 text-xs sm:text-sm lg:text-base leading-relaxed px-1">
                Book our guided tours to visit these incredible Russian landmarks with expert local guides
              </p>
              <button
                onClick={() => window.location.href = '/services'}
                className="bg-russian-gold hover:bg-russian-gold/90 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-md font-semibold transition-colors text-sm sm:text-base"
              >
                Explore Our Tours
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Gallery;
