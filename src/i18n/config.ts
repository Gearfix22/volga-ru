import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from '../../public/locales/en/common.json';
import ar from '../../public/locales/ar/common.json';
import ru from '../../public/locales/ru/common.json';

const resources = {
  en: {
    common: en,
  },
  ar: {
    common: ar,
  },
  ru: {
    common: ru,
  },
};

// RTL languages
export const RTL_LANGUAGES = ['ar'];

// Check if a language is RTL
export const isRTLLanguage = (lang: string): boolean => {
  return RTL_LANGUAGES.includes(lang);
};

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'ar', 'ru'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ar: 'العربية',
  ru: 'Русский',
};

// Language flags
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  ar: '🇸🇦',
  ru: '🇷🇺',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    debug: false, // Disable debug to prevent console noise
    
    interpolation: {
      escapeValue: false, // React already does escaping
      formatSeparator: ',',
    },

    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'sessionStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false,
      // Re-render on language change
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
    },

    // CRITICAL: Properly handle missing translations
    saveMissing: false, // Disable in production
    
    // Return proper fallback - NEVER return the raw key
    returnEmptyString: false,
    returnNull: false,
    
    // Custom missing key handler that returns a user-friendly fallback
    parseMissingKeyHandler: (key: string) => {
      // Extract the last part of the key as a readable fallback
      const parts = key.split('.');
      const lastPart = parts[parts.length - 1];
      // Convert camelCase to readable text
      return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    },

    // Log missing keys only in development
    missingKeyHandler: (lngs, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        const languages = Array.isArray(lngs) ? lngs : [lngs];
        console.warn(`[i18n] Missing key: "${key}" in namespace "${ns}" for languages: ${languages.join(', ')}`);
      }
    },
  });

// Apply initial direction based on saved language
const savedLang = localStorage.getItem('i18nextLng') || 'en';
const isInitialRTL = isRTLLanguage(savedLang);
document.documentElement.dir = isInitialRTL ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;
if (isInitialRTL) {
  document.documentElement.classList.add('rtl');
} else {
  document.documentElement.classList.remove('rtl');
}

// Listen for language changes and update document direction
i18n.on('languageChanged', (lng) => {
  const isRTL = isRTLLanguage(lng);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  // Add/remove RTL class for additional styling hooks
  if (isRTL) {
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.classList.remove('rtl');
  }
  
  // Persist language choice
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;