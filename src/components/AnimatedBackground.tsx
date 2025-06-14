
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Ocean gradient background */}
      <div className="absolute inset-0 ocean-gradient" />
      
      {/* Animated ocean waves overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-ocean-200/20 rounded-full blur-3xl"
          style={{
            animation: 'float 15s ease-in-out infinite',
            animationDelay: '5s'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-coastal-teal/20 rounded-full blur-3xl"
          style={{
            animation: 'float 18s ease-in-out infinite',
            animationDelay: '8s'
          }}
        />
      </div>
      
      {/* Wave pattern overlay */}
      <div className="absolute inset-0 wave-pattern opacity-30" />
      
      {/* Subtle shimmer effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)
          `,
          backgroundSize: '200% 200%',
          animation: 'wave 20s ease-in-out infinite'
        }}
      />
    </div>
  );
};
