
import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="text-center animate-fade-in">
      <div className="inline-block">
        {/* Company logo image */}
        <div className="relative mb-6">
          <img 
            src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
            alt="Volga Services Logo"
            className="w-32 h-32 md:w-40 md:h-40 mx-auto animate-float"
          />
        </div>
        
        {/* Company name */}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 font-serif">
          <span className="gradient-text">VOLGA</span>
          <span className="text-white ml-3">SERVICES</span>
        </h1>
        
        {/* Elegant underline */}
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-volga-logo-red to-transparent mx-auto" />
      </div>
    </div>
  );
};
