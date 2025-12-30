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

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t, isRTL, languages, getLanguageName, getLanguageFlag } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
        >
          <Languages className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          <span className={isRTL ? 'ml-2' : 'mr-2'}>{getLanguageFlag(language)}</span>
          <span className="hidden sm:inline">{getLanguageName(language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isRTL ? 'start' : 'end'} 
        className="bg-volga-navy/95 border-volga-blue/20 backdrop-blur-sm"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`text-white hover:bg-volga-blue/20 cursor-pointer ${
              language === lang ? 'bg-volga-blue/30' : ''
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
