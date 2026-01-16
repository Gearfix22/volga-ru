import React, { useEffect, useState, useRef } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const hasCalledFinish = useRef(false);

  useEffect(() => {
    // Store onFinish in closure, call only once
    const callFinish = () => {
      if (hasCalledFinish.current) return;
      hasCalledFinish.current = true;
      onFinish();
    };

    // Main timer for splash duration (fade start)
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    // Finish timer (fade complete)
    const finishTimer = setTimeout(() => {
      callFinish();
    }, 2000);

    // Failsafe - always finish within 3 seconds
    const failsafeTimer = setTimeout(() => {
      callFinish();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      clearTimeout(failsafeTimer);
    };
  }, []); // Empty deps - run only once

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
