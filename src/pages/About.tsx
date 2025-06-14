
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center text-shadow font-serif">
              {t('aboutUs')}
            </h1>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white">
              <p className="text-lg leading-relaxed mb-6">
                {t('aboutDescription')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4 text-volga-logo-blue">
                    {t('ourMission')}
                  </h3>
                  <p className="text-gray-200">
                    {t('missionDescription')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold mb-4 text-volga-logo-blue">
                    {t('ourVision')}
                  </h3>
                  <p className="text-gray-200">
                    {t('visionDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;
