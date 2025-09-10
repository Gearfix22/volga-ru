
import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { t } = useLanguage();

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 text-shadow-elegant font-serif leading-tight px-1">
            {t('pages.aboutUs')}
          </h1>
        </header>
        
        <article className="coastal-glass rounded-xl p-3 sm:p-5 lg:p-6 text-white border border-white/20">
          <p className="text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-5 text-coastal-pearl">
            {t('pages.aboutDescription')}
          </p>
          
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <section>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 text-coastal-blue">
                {t('pages.ourMission')}
              </h2>
              <p className="text-coastal-pearl text-sm sm:text-base leading-relaxed">
                {t('pages.missionDescription')}
              </p>
            </section>
            
            <section>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 text-coastal-blue">
                {t('pages.ourVision')}
              </h2>
              <p className="text-coastal-pearl text-sm sm:text-base leading-relaxed">
                {t('pages.visionDescription')}
              </p>
            </section>
          </div>
        </article>
      </div>
    </PageContainer>
  );
};

export default About;
