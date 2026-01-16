import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Language Switcher Component
 * محوّل اللغات - يدعم RTL والثيمات المختلفة
 */
export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, isRTL, languages, getLanguageName, getLanguageFlag } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-background/10 border-border/50 text-foreground hover:bg-background/20 active:bg-background/30 backdrop-blur-sm gap-1.5 min-h-[44px] touch-manipulation"
        >
          <Languages className="h-4 w-4" />
          <span>{getLanguageFlag(language)}</span>
          <span className="hidden sm:inline text-sm">{getLanguageName(language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isRTL ? 'start' : 'end'} 
        className="bg-popover border-border min-w-[140px]"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer min-h-[48px] touch-manipulation ${
              language === lang ? 'bg-accent text-accent-foreground' : ''
            } ${isRTL ? 'flex-row-reverse text-right' : ''}`}
          >
            <span className={isRTL ? 'ml-3' : 'mr-3'}>{getLanguageFlag(lang)}</span>
            <span>{getLanguageName(lang)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
