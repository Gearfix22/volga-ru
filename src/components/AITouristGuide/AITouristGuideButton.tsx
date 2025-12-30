import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AITouristGuideModal } from './AITouristGuideModal';

export const AITouristGuideButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-4 flex items-center gap-2 transition-all duration-200"
        aria-label="AI Tourist Guide"
      >
        <Bot className="h-6 w-6 shrink-0" />
        <span className="text-sm font-medium hidden sm:inline">AI Tourist Guide</span>
      </Button>
      
      <AITouristGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
