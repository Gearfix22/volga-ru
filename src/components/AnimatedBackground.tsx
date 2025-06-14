
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient background with logo-matched colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800" />
      
      {/* Animated liquid orbs with logo colors */}
      <div className="absolute inset-0">
        {/* Large primary orb - blue theme */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 liquid-orb opacity-35"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.4))',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            animationDelay: '0s'
          }}
        />
        
        {/* Medium secondary orb - red/orange theme */}
        <div 
          className="absolute top-3/4 right-1/4 w-80 h-80 liquid-orb-2 opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(245, 158, 11, 0.4))',
            borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%',
            animationDelay: '2s'
          }}
        />
        
        {/* Small tertiary orb - blue/gold mix */}
        <div 
          className="absolute bottom-1/4 left-1/2 w-64 h-64 liquid-orb-3 opacity-25"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(245, 158, 11, 0.3))',
            borderRadius: '40% 60% 60% 40% / 50% 50% 50% 50%',
            animationDelay: '4s'
          }}
        />
        
        {/* Additional floating orbs with logo colors */}
        <div 
          className="absolute top-1/2 right-1/3 w-32 h-32 liquid-orb opacity-20"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.5), rgba(59, 130, 246, 0.4))',
            borderRadius: '70% 30% 50% 50% / 40% 60% 50% 50%',
            animationDelay: '1s'
          }}
        />
        
        <div 
          className="absolute top-1/3 left-2/3 w-48 h-48 liquid-orb-2 opacity-22"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(239, 68, 68, 0.3))',
            borderRadius: '30% 70% 40% 60% / 60% 40% 50% 50%',
            animationDelay: '3s'
          }}
        />
        
        {/* Extra small accent orbs */}
        <div 
          className="absolute top-1/5 left-1/5 w-24 h-24 liquid-orb-3 opacity-18"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(245, 158, 11, 0.3))',
            borderRadius: '60% 40% 50% 50% / 40% 60% 40% 60%',
            animationDelay: '5s'
          }}
        />
      </div>
      
      {/* Glass morphism overlay with logo-inspired pattern */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(239, 68, 68, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)
          `,
          backgroundSize: '800px 800px, 600px 600px, 400px 400px',
          animation: 'logoGradientShift 10s ease-in-out infinite'
        }}
      />
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
};
