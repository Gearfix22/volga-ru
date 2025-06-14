
import React from 'react';

interface LogoProps {
  showFullBranding?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ 
  showFullBranding = true, 
  size = 'medium' 
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

  return (
    <div className="text-center animate-fade-in">
      <div className="inline-block">
        {/* Company logo image */}
        <div className="relative mb-6">
          <img 
            src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
            alt="Volga Services Logo"
            className={`${sizeClasses[size]} mx-auto animate-float`}
          />
        </div>
        
        {showFullBranding && (
          <>
            {/* Company name */}
            <h1 className={`${textSizeClasses[size]} font-bold mb-2 font-serif`}>
              <span className="text-russian-blue">VOLGA</span>
              <span className="text-russian-red ml-3">SERVICES</span>
            </h1>
            
            {/* Elegant underline */}
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-volga-logo-red to-transparent mx-auto" />
          </>
        )}
      </div>
    </div>
  );
};
