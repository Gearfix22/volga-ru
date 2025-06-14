
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { Menu, X } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

export const Navigation: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { key: 'home', path: '/', label: t('home') },
    { key: 'services', path: '/services', label: t('services') },
    { key: 'about', path: '/about', label: t('about') },
    { key: 'contact', path: '/contact', label: t('contact') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-slate-200/50 dark:border-slate-700/50 fade-in">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
            <Logo showFullBranding={false} size="small" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList className="space-x-1">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.key}>
                    <NavigationMenuLink
                      className={cn(
                        "relative px-6 py-2 text-sm font-medium transition-all duration-300 rounded-2xl",
                        "hover:bg-slate-100 dark:hover:bg-slate-800 transform hover:scale-105",
                        isActive(item.path) 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-700 dark:text-slate-300 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex-shrink-0">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-6 fade-in-up">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "block w-full text-left px-4 py-3 rounded-2xl transition-all duration-300",
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
