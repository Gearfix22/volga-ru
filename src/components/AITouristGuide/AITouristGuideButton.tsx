import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AITouristGuideModal } from './AITouristGuideModal';

export const AITouristGuideButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0 flex items-center justify-center group"
        aria-label="AI Tourist Guide"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute right-16 bg-background text-foreground px-3 py-1.5 rounded-lg shadow-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border">
          AI Tourist Guide
        </span>
      </Button>
      
      <AITouristGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
