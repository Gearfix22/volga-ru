import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FloatingWhatsAppButton: React.FC = () => {
  const whatsappNumber = '79522212903';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
      aria-label="Open WhatsApp chat with Volga Services"
      title="Chat with us on WhatsApp"
    >
      <Button
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 group-hover:scale-110 focus-visible:ring-2 focus-visible:ring-white"
        tabIndex={-1}
      >
        <MessageCircle className="w-6 h-6" aria-hidden="true" />
        <span className="sr-only">Chat on WhatsApp</span>
      </Button>
      <span 
        className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-md"
        role="tooltip"
      >
        Chat on WhatsApp
      </span>
    </a>
  );
};
