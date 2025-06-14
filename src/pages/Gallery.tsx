
import React from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

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
      <div className="relative z-10 pt-12 sm:pt-14 lg:pt-16 xl:pt-20 pb-6 sm:pb-8 lg:pb-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 font-serif leading-tight px-2">
              <span className="kremlin-text">GALLERY</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-russian-cream max-w-4xl mx-auto px-2 leading-relaxed">
              Discover the magnificent landmarks and architectural wonders of Russia
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {landmarks.map((landmark) => (
              <Card 
                key={landmark.id} 
                className="group overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={landmark.image}
                    alt={landmark.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1 leading-tight">{landmark.name}</h3>
                    <p className="text-russian-cream text-xs sm:text-sm">{landmark.location}</p>
                  </div>
                </div>
                <CardContent className="p-3 sm:p-4">
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{landmark.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-8 sm:mt-10 lg:mt-12">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 font-serif leading-tight">
                Experience These Landmarks
              </h2>
              <p className="text-russian-cream mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed px-2">
                Book our guided tours to visit these incredible Russian landmarks with expert local guides
              </p>
              <button
                onClick={() => window.location.href = '/services'}
                className="bg-russian-gold hover:bg-russian-gold/90 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-semibold transition-colors text-sm sm:text-base"
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
