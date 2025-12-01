import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 400);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 bg-background flex items-center justify-center transition-opacity duration-400 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="text-center animate-fade-in">
        <img 
          src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
          alt="Volga Services"
          className="w-24 h-24 mx-auto mb-4"
        />
        <h1 className="text-2xl font-serif font-bold text-primary tracking-tight">VOLGA</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Services</p>
        
        {/* Loading bar */}
        <div className="mt-6 w-20 h-1 bg-muted rounded-full overflow-hidden mx-auto">
          <div className="h-full w-full bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
