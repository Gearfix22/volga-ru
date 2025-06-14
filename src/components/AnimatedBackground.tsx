
import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary background with modern gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />
      
      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0 opacity-40">
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-pink-500/20 animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute inset-0 bg-gradient-to-bl from-cyan-500/10 via-transparent to-purple-500/10 animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
      </div>
      
      {/* Geometric pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.3) 0%, transparent 70%),
            radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.3) 0%, transparent 70%),
            linear-gradient(45deg, rgba(6, 182, 212, 0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(99, 102, 241, 0.1) 25%, transparent 25%)
          `,
          backgroundSize: '60px 60px, 80px 80px, 40px 40px, 40px 40px'
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute inset-0">
        <div className="floating-element absolute top-1/4 left-1/6 w-32 h-32 bg-purple-500/10 rounded-full blur-xl" />
        <div className="floating-element absolute top-3/4 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-xl animation-delay-1000" />
        <div className="floating-element absolute top-1/2 left-3/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animation-delay-1500" />
      </div>
      
      {/* Subtle grid lines */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />
    </div>
  );
};
