import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const FloatingWhatsAppButton: React.FC = () => {
  const { t } = useLanguage();
  const whatsappNumber = '79522212903';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label={t('footer.whatsapp')}
    >
      <Button
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 group-hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
      <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        {t('footer.whatsapp')}
      </span>
    </a>
  );
};
