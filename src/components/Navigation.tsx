
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { UserMenu } from './auth/UserMenu';
import { Menu, X } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { key: 'home', path: '/', label: t('navbar.home') },
    { key: 'services', path: '/services', label: t('navbar.services') },
    { key: 'gallery', path: '/gallery', label: t('navbar.gallery') },
    { key: 'about', path: '/about', label: t('navbar.about') },
    { key: 'contact', path: '/contact', label: t('navbar.contact') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-glass backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo with Company Name */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img 
              src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
              alt="Volga Services Logo"
              className="w-8 h-8 lg:w-10 lg:h-10 transition-transform group-hover:scale-105"
            />
            <div className="font-bold text-lg lg:text-xl font-serif">
              <span className="bg-gradient-to-r from-brand-accent to-brand-primary bg-clip-text text-transparent">
                VOLGA
              </span>
              <span className="ml-1 text-foreground">SERVICES</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive(item.path) 
                    ? 'text-brand-accent bg-brand-accent/10' 
                    : 'text-foreground hover:text-brand-accent hover:bg-brand-accent/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-2">
            {/* Theme Switcher */}
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>

            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* User Menu */}
            <UserMenu />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-foreground hover:text-brand-accent p-2 rounded-md hover:bg-brand-accent/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t border-border/50 py-2">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'text-brand-accent bg-brand-accent/10'
                      : 'text-foreground hover:text-brand-accent hover:bg-brand-accent/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {/* Language Switcher in mobile menu */}
              <div className="px-4 py-2 sm:hidden">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
