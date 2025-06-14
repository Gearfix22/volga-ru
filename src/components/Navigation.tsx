
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo with Company Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="/lovable-uploads/59c9df84-8fe5-4586-8345-8d4dc6f37535.png"
              alt="Volga Services Logo"
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <span className="text-white font-bold text-xl sm:text-2xl font-serif">
              <span className="luxury-text">VOLGA</span>
              <span className="ml-2">SERVICES</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.path) 
                      ? 'text-ocean-300 border-b-2 border-ocean-300' 
                      : 'text-white/90 hover:text-ocean-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Book Now Button */}
            <Button
              onClick={() => navigate('/booking')}
              className="bg-ocean-500 hover:bg-ocean-600 text-white px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 hidden sm:block"
            >
              Book Now
            </Button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white p-2 glass-effect rounded-lg"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-6 glass-effect mt-2 rounded-lg">
            <div className="space-y-2 p-4">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
                    isActive(item.path)
                      ? 'text-ocean-300 bg-white/10'
                      : 'text-white hover:text-ocean-300 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile Language Switcher and Book Button */}
              <div className="px-4 py-2 border-t border-white/10 mt-4 pt-4 space-y-3">
                <LanguageSwitcher />
                <Button
                  onClick={() => {
                    navigate('/booking');
                    setIsOpen(false);
                  }}
                  className="w-full bg-ocean-500 hover:bg-ocean-600 text-white py-2 text-sm font-semibold rounded-full"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
