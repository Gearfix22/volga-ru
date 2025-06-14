
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Kremlin landmark background photo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1513326738677-b964603b136d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80')`
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Russian flag colors gradient overlay */}
      <div className="absolute inset-0 russia-gradient opacity-60" />
      
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
      <div className="absolute inset-0 kremlin-pattern opacity-20" />
      
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
