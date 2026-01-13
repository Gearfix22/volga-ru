import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AITravelGuidePanel } from './AITravelGuidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const AITravelGuideButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const labels: Record<string, string> = {
    en: 'Travel Guide',
    ar: 'مرشد السفر',
    ru: 'Гид',
  };

  return (
    <>
      {/* Floating Button - Fixed position, non-blocking, pointer-events only on button */}
      <div className="fixed bottom-4 z-40 pointer-events-none" style={{ left: '1rem' }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "pointer-events-auto shadow-lg transition-all duration-300",
            "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "text-primary-foreground",
            isOpen 
              ? "h-10 w-10 rounded-full p-0" 
              : "h-12 rounded-full px-4 gap-2"
          )}
          aria-label="AI Travel Guide"
        >
          <Sparkles className={cn("shrink-0", isOpen ? "h-4 w-4" : "h-5 w-5")} />
          {!isOpen && (
            <span className="text-sm font-medium hidden sm:inline">
              {labels[language] || labels.en}
            </span>
          )}
        </Button>
      </div>
      
      {/* Panel */}
      <AITravelGuidePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
