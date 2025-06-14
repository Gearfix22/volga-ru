
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
      <div className="relative z-10 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-6xl">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 text-center text-shadow-elegant font-serif leading-tight px-2">
              {t('aboutUs')}
            </h1>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 text-white border border-russian-gold/20">
              <p className="text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6">
                {t('aboutDescription')}
              </p>
              
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 text-russian-gold">
                    {t('ourMission')}
                  </h3>
                  <p className="text-russian-cream text-sm sm:text-base leading-relaxed">
                    {t('missionDescription')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 text-russian-gold">
                    {t('ourVision')}
                  </h3>
                  <p className="text-russian-cream text-sm sm:text-base leading-relaxed">
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
