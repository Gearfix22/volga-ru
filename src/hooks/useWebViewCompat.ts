import { useEffect, useCallback, useRef } from 'react';
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

// Prevent reload loops after login
const preventReloadLoop = () => {
  const lastReload = sessionStorage.getItem('lastReload');
  const now = Date.now();
  
  if (lastReload && (now - parseInt(lastReload)) < 2000) {
    // Reload happened less than 2 seconds ago, prevent another
    return true;
  }
  
  sessionStorage.setItem('lastReload', now.toString());
  return false;
};

// Hook for WebView back button handling
export const useWebViewBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationInProgress = useRef(false);

  const handleBackButton = useCallback(() => {
    // Prevent multiple rapid back navigations
    if (navigationInProgress.current) return true;
    
    // Root pages - let Android handle back (exit app)
    const exitPages = ['/', '/auth', '/admin-login', '/driver-login', '/guide-login'];
    if (exitPages.includes(location.pathname)) {
      return false; // Let Android handle exit
    }
    
    // Dashboard pages - go to home
    const dashboardPages = ['/user-dashboard', '/driver-dashboard', '/guide-dashboard', '/admin'];
    if (dashboardPages.some(p => location.pathname.startsWith(p))) {
      navigationInProgress.current = true;
      navigate('/');
      setTimeout(() => { navigationInProgress.current = false; }, 500);
      return true;
    }
    
    // All other pages - navigate back
    navigationInProgress.current = true;
    navigate(-1);
    setTimeout(() => { navigationInProgress.current = false; }, 500);
    return true;
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!isAndroidWebView()) return;

    // Prevent reload loops
    if (preventReloadLoop()) {
      console.log('Prevented reload loop');
    }

    // Listen for Android back button via custom event
    const handleAndroidBack = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      handleBackButton();
    };

    // Handle hardware back button
    document.addEventListener('backbutton', handleAndroidBack, { capture: true });
    
    // Handle popstate for browser back - prevent page reload
    const handlePopState = (e: PopStateEvent) => {
      // Prevent default and handle navigation ourselves
      if (navigationInProgress.current) {
        e.preventDefault();
      }
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
    const handleDeepLink = (url: string): boolean => {
      // Handle WhatsApp links
      if (url.includes('wa.me') || url.includes('whatsapp')) {
        openExternalLink(url);
        return true;
      }
      // Handle map links
      if (url.includes('maps.') || url.includes('geo:') || url.includes('mapbox')) {
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
      // Handle payment links
      if (url.includes('pay.') || url.includes('payment')) {
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
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick);
  }, []);
};

// Hook to check if features are supported in WebView
export const useWebViewFeatureDetection = () => {
  const isGeolocationSupported = 'geolocation' in navigator;
  const isNotificationSupported = 'Notification' in window && !isAndroidWebView();
  const isSpeechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  return {
    isGeolocationSupported,
    isNotificationSupported,
    isSpeechRecognitionSupported,
    isWebView: isWebView(),
    isAndroidWebView: isAndroidWebView(),
    isIOSWebView: isIOSWebView(),
  };
};