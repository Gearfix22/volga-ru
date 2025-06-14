
import React from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleExploreServices = () => {
    console.log('Navigating to services page...');
    navigate('/services');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 relative overflow-hidden">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-xl floating" />
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-800/20 rounded-full blur-xl floating" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-40 h-40 bg-slate-200/20 dark:bg-slate-800/20 rounded-full blur-xl floating" style={{ animationDelay: '4s' }} />
      </div>

      {/* Logo with modern styling */}
      <div className="mb-16 relative z-10 fade-in-up">
        <div className="modern-card p-8 hover:shadow-xl transition-all duration-500">
          <div className="transform hover:scale-110 transition-all duration-500">
            <Logo />
          </div>
        </div>
      </div>
      
      {/* Hero content with clean typography */}
      <div className="max-w-5xl mx-auto mb-12 space-y-6 relative z-10 fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3 modern-card px-6 py-3">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-slate-600 dark:text-slate-400 font-medium text-sm tracking-wide">
              Premium Services
            </span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
          <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent block mb-2">
            {t('welcome')}
          </span>
        </h2>
        
        <p className={`text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mx-auto font-light ${
          language === 'ar' ? 'font-medium' : ''
        }`}>
          {t('subtitle')}
        </p>
      </div>
      
      {/* Modern CTA Button */}
      <div className="relative z-10 fade-in-up" style={{ animationDelay: '0.4s' }}>
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="modern-button text-lg px-8 py-4 shadow-lg hover:shadow-xl group"
        >
          <span className="flex items-center space-x-3">
            <span className="font-semibold">{t('exploreServices')}</span>
            <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'} transition-transform group-hover:translate-x-1`} />
          </span>
        </Button>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="w-1 h-12 bg-gradient-to-b from-primary to-transparent rounded-full opacity-60" />
      </div>
    </div>
  );
};
