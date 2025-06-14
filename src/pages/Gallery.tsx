
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
      <div className="relative z-10 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 font-serif">
              <span className="kremlin-text">GALLERY</span>
            </h1>
            <p className="text-lg sm:text-xl text-russian-cream max-w-3xl mx-auto">
              Discover the magnificent landmarks and architectural wonders of Russia
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {landmarks.map((landmark) => (
              <Card 
                key={landmark.id} 
                className="group overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={landmark.image}
                    alt={landmark.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1">{landmark.name}</h3>
                    <p className="text-russian-cream text-sm">{landmark.location}</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-white/80 text-sm">{landmark.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-serif">
                Experience These Landmarks
              </h2>
              <p className="text-russian-cream mb-6">
                Book our guided tours to visit these incredible Russian landmarks with expert local guides
              </p>
              <button
                onClick={() => window.location.href = '/services'}
                className="bg-russian-gold hover:bg-russian-gold/90 text-white px-8 py-3 rounded-md font-semibold transition-colors"
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
