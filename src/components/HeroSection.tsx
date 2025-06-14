
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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-1/4 left-1/4 w-4 h-4 bg-purple-500/30 rounded-full blur-sm" />
        <div className="floating-element absolute top-1/3 right-1/3 w-3 h-3 bg-pink-500/40 rounded-full blur-sm animation-delay-1000" />
        <div className="floating-element absolute bottom-1/3 left-1/2 w-2 h-2 bg-cyan-500/50 rounded-full blur-sm animation-delay-1500" />
        <div className="floating-element absolute top-1/2 right-1/4 w-5 h-5 bg-purple-500/20 rounded-full blur-sm animation-delay-2000" />
      </div>

      {/* Logo with unique styling */}
      <div className="mb-20 relative z-10">
        <div className="morphing-border p-8 rounded-3xl holographic">
          <div className="transform hover:scale-110 transition-all duration-500">
            <Logo />
          </div>
        </div>
      </div>
      
      {/* Hero content with modern typography */}
      <div className="max-w-6xl mx-auto mb-16 space-y-8 relative z-10">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <Zap className="h-5 w-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-medium text-sm uppercase tracking-[0.2em] font-space-grotesk">
              Premium Services
            </span>
            <Sparkles className="h-5 w-5 text-pink-400 animate-pulse animation-delay-400" />
          </div>
        </div>
        
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-12 text-glow leading-[0.9] font-crimson">
          <span className="text-gradient block mb-4">
            {t('welcome')}
          </span>
        </h2>
        
        <p className={`text-xl md:text-2xl lg:text-3xl text-gray-300 leading-relaxed max-w-5xl mx-auto font-light ${
          language === 'ar' ? 'font-medium' : ''
        } font-space-grotesk`}>
          <span className="bg-gradient-to-r from-gray-200 via-white to-gray-300 bg-clip-text text-transparent">
            {t('subtitle')}
          </span>
        </p>
      </div>
      
      {/* Modern CTA Button */}
      <div className="relative z-10 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500" />
        <Button
          onClick={handleExploreServices}
          size="lg"
          className="relative bg-black/50 backdrop-blur-sm border border-white/20 text-white font-semibold px-12 py-6 text-lg rounded-full transition-all duration-500 transform hover:scale-105 glassmorphism pulse-glow font-space-grotesk"
        >
          <span className="flex items-center space-x-3">
            <span className="text-gradient font-medium">{t('exploreServices')}</span>
            <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-3 rotate-180' : 'ml-3'} transition-transform group-hover:translate-x-1`} />
          </span>
        </Button>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-1 h-16 bg-gradient-to-b from-purple-500 via-pink-500 to-transparent rounded-full animate-pulse" />
      </div>
    </div>
  );
};
