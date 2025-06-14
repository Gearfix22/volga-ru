
import React from 'react';

interface LogoProps {
  showFullBranding?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ 
  showFullBranding = false, 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-32 h-32 md:w-40 md:h-40',
    large: 'w-40 h-40 md:w-48 md:h-48'
  };

  return (
    <div className="text-center animate-fade-in">
      <div className="inline-block">
        {/* Company logo image */}
        <div className="relative">
          <img 
            src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
            alt="Volga Services Logo"
            className={`${sizeClasses[size]} mx-auto animate-float`}
          />
        </div>
      </div>
    </div>
  );
};
