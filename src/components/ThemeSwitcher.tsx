import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

export const ThemeSwitcher = () => {
  const { t } = useLanguage();
  const [theme, setTheme] = useState<'teal' | 'russian'>('teal');

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('color-theme') as 'teal' | 'russian' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (selectedTheme: 'teal' | 'russian') => {
    const root = document.documentElement;
    
    if (selectedTheme === 'russian') {
      root.setAttribute('data-theme', 'russian');
    } else {
      root.removeAttribute('data-theme');
    }
    
    localStorage.setItem('color-theme', selectedTheme);
  };

  const handleThemeChange = (selectedTheme: 'teal' | 'russian') => {
    setTheme(selectedTheme);
    applyTheme(selectedTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative min-h-[44px] min-w-[44px] touch-manipulation">
          <Palette className="h-5 w-5" />
          <span className="sr-only">{t('theme.selectTheme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('theme.colorTheme')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleThemeChange('teal')}
          className={`min-h-[48px] cursor-pointer touch-manipulation ${theme === 'teal' ? 'bg-accent/50' : ''}`}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="flex gap-1">
              <div className="w-5 h-5 rounded-full bg-[hsl(180,83%,24%)]" />
              <div className="w-5 h-5 rounded-full bg-[hsl(349,76%,52%)]" />
              <div className="w-5 h-5 rounded-full bg-[hsl(152,69%,37%)]" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{t('theme.modernTeal')}</p>
              <p className="text-xs text-muted-foreground">{t('theme.modernTealDesc')}</p>
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleThemeChange('russian')}
          className={`min-h-[48px] cursor-pointer touch-manipulation ${theme === 'russian' ? 'bg-accent/50' : ''}`}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="flex gap-1">
              <div className="w-5 h-5 rounded-full bg-[hsl(220,60%,28%)]" />
              <div className="w-5 h-5 rounded-full bg-[hsl(45,90%,42%)]" />
              <div className="w-5 h-5 rounded-full bg-[hsl(0,70%,45%)]" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{t('theme.russianElegance')}</p>
              <p className="text-xs text-muted-foreground">{t('theme.russianEleganceDesc')}</p>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
