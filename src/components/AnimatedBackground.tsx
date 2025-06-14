
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Ocean gradient background */}
      <div className="absolute inset-0 ocean-gradient" />
      
      {/* Animated wave overlay */}
      <div className="absolute inset-0 wave-pattern opacity-30" />
      
      {/* Floating elements for depth */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-ocean-300/20 rounded-full blur-3xl"
          style={{
            animation: 'float 15s ease-in-out infinite',
            animationDelay: '5s'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-sand-200/20 rounded-full blur-3xl"
          style={{
            animation: 'float 18s ease-in-out infinite',
            animationDelay: '8s'
          }}
        />
      </div>
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
    </div>
  );
};
