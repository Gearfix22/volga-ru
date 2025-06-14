
import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="text-center animate-fade-in">
      <div className="inline-block">
        {/* Logo symbol - stylized V for Volga */}
        <div className="relative mb-4">
          <div className="text-6xl md:text-8xl font-bold text-volga-gold animate-float">
            В
          </div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-volga-gold rounded-full animate-pulse" />
        </div>
        
        {/* Company name */}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 font-serif">
          <span className="gradient-text">VOLGA</span>
          <span className="text-white ml-3">SERVICES</span>
        </h1>
        
        {/* Elegant underline */}
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-volga-gold to-transparent mx-auto" />
      </div>
    </div>
  );
};
