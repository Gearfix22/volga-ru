import React from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
  showFooter?: boolean;
  paddingTop?: 'sm' | 'md' | 'lg';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  showNavigation = true,
  showFooter = true,
  paddingTop = 'md'
}) => {
  const paddingClasses = {
    sm: 'pt-8 sm:pt-10',
    md: 'pt-12 sm:pt-14 lg:pt-16',
    lg: 'pt-16 sm:pt-18 lg:pt-20'
  };

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen flex flex-col overflow-x-hidden overflow-y-auto">
        {/* Animated Background */}
        <AnimatedBackground />
        
        {/* Navigation */}
        {showNavigation && <Navigation />}
        
        {/* Main Content */}
        <main 
          className={cn(
            'relative z-10 flex-1 pb-4 sm:pb-6 lg:pb-8',
            paddingClasses[paddingTop],
            className
          )}
        >
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl w-full">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        {showFooter && <Footer />}
      </div>
    </ErrorBoundary>
  );
};