
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
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

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { key: 'home', path: '/', label: t('home') },
    { key: 'services', path: '/services', label: t('services') },
    { key: 'about', path: '/about', label: t('about') },
    { key: 'contact', path: '/contact', label: t('contact') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-volga-navy/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Logo showFullBranding={false} size="small" />
          </div>

          {/* Navigation Menu - Desktop */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.key}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'bg-transparent text-white hover:bg-white/10 hover:text-white font-medium',
                        isActive(item.path) && 'bg-volga-logo-blue text-white'
                      )}
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Language Switcher */}
          <div className="flex-shrink-0">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};
