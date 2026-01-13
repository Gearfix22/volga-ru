import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openExternalLink, isWebView } from '@/hooks/useWebViewCompat';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Floating WhatsApp Button Component
 * زر واتساب عائم - يظهر فقط للمستخدمين المسجلين
 * 
 * Features:
 * - Only visible for authenticated users
 * - Hidden on admin, driver, and guide routes
 * - Supports RTL languages
 * - WebView compatible for mobile apps
 */
export const FloatingWhatsAppButton: React.FC = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  
  const whatsappNumber = '79522212903';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  // Hide WhatsApp button on driver, admin, and guide routes
  const isDriverRoute = location.pathname.startsWith('/driver');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isGuideRoute = location.pathname.startsWith('/guide');
  const isAuthRoute = location.pathname === '/auth';
  
  // Only show for authenticated users, hide on special routes
  // لا تظهر الزر إلا للمستخدمين المسجلين
  if (loading || !user || isDriverRoute || isAdminRoute || isGuideRoute || isAuthRoute) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isWebView()) {
      e.preventDefault();
      openExternalLink(whatsappUrl);
    }
  };

  // Tooltip text in different languages
  const tooltipText: Record<string, string> = {
    en: 'Chat on WhatsApp',
    ar: 'تحدث معنا على واتساب',
    ru: 'Написать в WhatsApp',
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
      aria-label={tooltipText[language] || tooltipText.en}
      title={tooltipText[language] || tooltipText.en}
    >
      <Button
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 group-hover:scale-110 focus-visible:ring-2 focus-visible:ring-white"
        tabIndex={-1}
      >
        <MessageCircle className="w-6 h-6" aria-hidden="true" />
        <span className="sr-only">{tooltipText[language] || tooltipText.en}</span>
      </Button>
      <span 
        className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-md"
        role="tooltip"
      >
        {tooltipText[language] || tooltipText.en}
      </span>
    </a>
  );
};
