
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const onFinishRef = useRef(onFinish);
  const hasCalledFinish = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const handleFinish = useCallback(() => {
    if (hasCalledFinish.current) return;
    hasCalledFinish.current = true;
    onFinishRef.current();
  }, []);

  useEffect(() => {
    // Main timer for splash duration
    const splashTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1800); // Slightly shorter for snappier feel

    // Fade-out + finish timer
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 2300); // 1800 + 500ms for fade

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(finishTimer);
    };
  }, [handleFinish]);

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
