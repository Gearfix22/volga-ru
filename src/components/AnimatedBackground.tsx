
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient background with liquid glass feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800" />
      
      {/* Animated liquid orbs */}
      <div className="absolute inset-0">
        {/* Large primary orb */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 liquid-orb opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.4))',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            animationDelay: '0s'
          }}
        />
        
        {/* Medium secondary orb */}
        <div 
          className="absolute top-3/4 right-1/4 w-80 h-80 liquid-orb-2 opacity-25"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(245, 158, 11, 0.3))',
            borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%',
            animationDelay: '2s'
          }}
        />
        
        {/* Small tertiary orb */}
        <div 
          className="absolute bottom-1/4 left-1/2 w-64 h-64 liquid-orb-3 opacity-20"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.3))',
            borderRadius: '40% 60% 60% 40% / 50% 50% 50% 50%',
            animationDelay: '4s'
          }}
        />
        
        {/* Additional small floating orbs */}
        <div 
          className="absolute top-1/2 right-1/3 w-32 h-32 liquid-orb opacity-15"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(59, 130, 246, 0.4))',
            borderRadius: '70% 30% 50% 50% / 40% 60% 50% 50%',
            animationDelay: '1s'
          }}
        />
        
        <div 
          className="absolute top-1/3 left-2/3 w-48 h-48 liquid-orb-2 opacity-18"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(239, 68, 68, 0.3))',
            borderRadius: '30% 70% 40% 60% / 60% 40% 50% 50%',
            animationDelay: '3s'
          }}
        />
      </div>
      
      {/* Glass morphism overlay with subtle pattern */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
          `,
          backgroundSize: '800px 800px, 600px 600px, 400px 400px',
          animation: 'gradientShift 8s ease-in-out infinite'
        }}
      />
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
};
