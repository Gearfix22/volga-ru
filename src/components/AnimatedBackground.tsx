
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-volga-navy via-volga-navy-light to-volga-navy-dark" />
      
      {/* Animated overlay elements */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-volga-blue/20 rounded-full blur-3xl"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-volga-logo-red/20 rounded-full blur-3xl"
          style={{
            animation: 'float 15s ease-in-out infinite',
            animationDelay: '5s'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-volga-gold/20 rounded-full blur-3xl"
          style={{
            animation: 'float 18s ease-in-out infinite',
            animationDelay: '8s'
          }}
        />
      </div>
      
      {/* Geometric pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)
          `,
          backgroundSize: '400px 400px'
        }}
      />
    </div>
  );
};
