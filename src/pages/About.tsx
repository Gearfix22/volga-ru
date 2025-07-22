
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
      <div className="relative z-10 pt-12 sm:pt-14 lg:pt-16 pb-6 sm:pb-8">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 max-w-6xl">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 text-center text-shadow-elegant font-serif leading-tight px-1">
              {t('pages.aboutUs')}
            </h1>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-5 lg:p-6 text-white border border-russian-gold/20">
              <p className="text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-5">
                {t('pages.aboutDescription')}
              </p>
              
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 text-russian-gold">
                    {t('pages.ourMission')}
                  </h3>
                  <p className="text-russian-cream text-sm sm:text-base leading-relaxed">
                    {t('pages.missionDescription')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 text-russian-gold">
                    {t('pages.ourVision')}
                  </h3>
                  <p className="text-russian-cream text-sm sm:text-base leading-relaxed">
                    {t('pages.visionDescription')}
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
