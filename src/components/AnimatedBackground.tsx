import React from 'react';

/**
 * Professional solid gradient background for booking app
 * No background images - clean, solid colors only
 */
export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Solid gradient background - professional teal to slate */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(180 83% 24%) 0%, hsl(200 60% 20%) 50%, hsl(220 40% 15%) 100%)'
        }}
      />
      
      {/* Subtle overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, hsl(180 70% 30% / 0.3) 0%, transparent 50%)'
        }}
      />
      
      {/* Bottom fade for content readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, hsl(220 40% 10% / 0.5) 100%)'
        }}
      />
    </div>
  );
};
