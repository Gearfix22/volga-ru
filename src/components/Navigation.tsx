
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './auth/UserMenu';
import { Menu, X } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { key: 'home', path: '/', label: t('home') },
    { key: 'services', path: '/services', label: t('services') },
    { key: 'gallery', path: '/gallery', label: 'Gallery' },
    { key: 'about', path: '/about', label: t('about') },
    { key: 'contact', path: '/contact', label: t('contact') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 russian-glass border-b border-russian-gold/20">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-11 sm:h-12 lg:h-14">
          {/* Logo with Company Name */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
              alt="Volga Services Logo"
              className="w-5 h-5 sm:w-7 sm:h-7 lg:w-9 lg:h-9"
            />
            <span className="text-white font-bold text-xs sm:text-sm lg:text-lg font-serif">
              <span className="kremlin-text">VOLGA</span>
              <span className="ml-1 text-russian-cream">SERVICES</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-1 xl:space-x-4">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`px-2 xl:px-3 py-2 text-sm lg:text-base font-medium transition-colors ${
                    isActive(item.path) 
                      ? 'text-russian-gold' 
                      : 'text-white hover:text-russian-gold'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* User Menu */}
            <UserMenu />

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white p-1"
              >
                {isOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-2 sm:pb-3">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-2 sm:px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-russian-gold'
                      : 'text-white hover:text-russian-gold'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {/* Language Switcher in mobile menu */}
              <div className="px-2 sm:px-3 py-1 sm:hidden">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
