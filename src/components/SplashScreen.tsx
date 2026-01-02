
import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Wait for fade out animation
    }, 2000); // Reduced from 6000 for better UX

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 bg-volga-navy flex items-center justify-center transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="text-center animate-fade-in">
        <div className="scale-150 transform">
          <Logo />
        </div>
        
        {/* Loading animation */}
        <div className="mt-8 flex justify-center">
          <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-volga-logo-blue to-volga-logo-red rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
