import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Detect if running in Android WebView
export const isAndroidWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('wv') || (ua.includes('android') && ua.includes('version/'));
};

// Detect if running in iOS WebView
export const isIOSWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone = (window.navigator as any).standalone;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
  return isIOS && !isStandalone && !isSafari;
};

export const isWebView = (): boolean => isAndroidWebView() || isIOSWebView();

// Handle external links in WebView
export const openExternalLink = (url: string): void => {
  if (isAndroidWebView()) {
    // Try to use Android interface if available
    if ((window as any).Android?.openExternalLink) {
      (window as any).Android.openExternalLink(url);
    } else {
      window.open(url, '_system');
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Hook for WebView back button handling
export const useWebViewBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackButton = useCallback(() => {
    if (location.pathname === '/' || location.pathname === '/auth') {
      // At root, let Android handle back (exit app)
      return false;
    }
    navigate(-1);
    return true;
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!isAndroidWebView()) return;

    // Listen for Android back button via custom event
    const handleAndroidBack = (e: Event) => {
      e.preventDefault();
      handleBackButton();
    };

    document.addEventListener('backbutton', handleAndroidBack);
    
    // Also handle popstate for browser back
    const handlePopState = () => {
      // Prevent page reload on back navigation
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('backbutton', handleAndroidBack);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBackButton]);

  return { handleBackButton, isWebView: isWebView() };
};

// Hook for handling deep links
export const useDeepLinkHandler = () => {
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      // Handle WhatsApp links
      if (url.includes('wa.me') || url.includes('whatsapp')) {
        openExternalLink(url);
        return true;
      }
      // Handle map links
      if (url.includes('maps.') || url.includes('geo:')) {
        openExternalLink(url);
        return true;
      }
      // Handle tel links
      if (url.startsWith('tel:')) {
        openExternalLink(url);
        return true;
      }
      // Handle mailto links
      if (url.startsWith('mailto:')) {
        openExternalLink(url);
        return true;
      }
      return false;
    };

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && handleDeepLink(href)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
};