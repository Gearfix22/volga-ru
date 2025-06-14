
import React from 'react';

interface LogoProps {
  showFullBranding?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ 
  showFullBranding = true, 
  size = 'medium',
  variant = 'light'
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-32 h-32 md:w-40 md:h-40',
    large: 'w-40 h-40 md:w-48 md:h-48'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-3xl md:text-5xl',
    large: 'text-4xl md:text-6xl'
  };

  // Choose the appropriate logo based on background
  const logoSrc = variant === 'light' 
    ? "/lovable-uploads/74d1c817-c5b9-4f38-9527-af8fc875d0e4.png" // Colored logo for light backgrounds
    : "/lovable-uploads/3f45c906-39cb-411c-999d-81770bd3e3e1.png"; // White logo for dark backgrounds

  return (
    <div className="text-center animate-fade-in">
      <div className="inline-block">
        {/* Company logo image */}
        <div className="relative mb-6">
          <img 
            src={logoSrc}
            alt="Volga Services Logo"
            className={`${sizeClasses[size]} mx-auto animate-float`}
          />
        </div>
        
        {showFullBranding && (
          <>
            {/* Company name */}
            <h1 className={`${textSizeClasses[size]} font-bold text-white mb-2 font-serif`}>
              <span className="gradient-text">VOLGA</span>
              <span className="text-white ml-3">SERVICES</span>
            </h1>
            
            {/* Elegant underline */}
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-volga-logo-red to-transparent mx-auto" />
          </>
        )}
      </div>
    </div>
  );
};
