
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
    small: 'w-10 h-10',
    medium: 'w-24 h-24 md:w-32 md:h-32',
    large: 'w-32 h-32 md:w-40 md:h-40'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl md:text-4xl',
    large: 'text-3xl md:text-5xl'
  };

  return (
    <div className="text-center animate-fade-in">
      <div className="inline-block">
        {/* Company logo image with better fit */}
        <div className="relative mb-4 md:mb-6">
          <div className="liquid-glass rounded-2xl p-3 md:p-4 inline-block">
            <img 
              src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
              alt="Volga Services Logo"
              className={`${sizeClasses[size]} mx-auto animate-float object-contain`}
            />
          </div>
        </div>
        
        {showFullBranding && (
          <>
            {/* Company name with logo-matched colors */}
            <h1 className={`${textSizeClasses[size]} font-bold text-white mb-2 font-serif`}>
              <span className="logo-gradient-text">VOLGA</span>
              <span className="text-white ml-2 md:ml-3">SERVICES</span>
            </h1>
            
            {/* Elegant underline with logo colors */}
            <div className="w-24 md:w-32 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto" />
          </>
        )}
      </div>
    </div>
  );
};
