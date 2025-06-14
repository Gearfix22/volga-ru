
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Russian landmarks gradient background */}
      <div className="absolute inset-0 russia-gradient" />
      
      {/* Animated floating elements overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-russian-gold/20 rounded-full blur-3xl"
          style={{
            animation: 'float 15s ease-in-out infinite',
            animationDelay: '5s'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-russian-red/20 rounded-full blur-3xl"
          style={{
            animation: 'float 18s ease-in-out infinite',
            animationDelay: '8s'
          }}
        />
      </div>
      
      {/* Kremlin-inspired pattern overlay */}
      <div className="absolute inset-0 kremlin-pattern opacity-30" />
      
      {/* Subtle shimmer effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.1) 50%, transparent 70%)
          `,
          backgroundSize: '200% 200%',
          animation: 'wave 20s ease-in-out infinite'
        }}
      />
    </div>
  );
};
