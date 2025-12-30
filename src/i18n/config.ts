import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { logMissingTranslation } from '@/utils/translationUtils';

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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    debug: false, // Disable debug in production
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'sessionStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false,
    },

    // Missing key handler - log for admin review
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      const languages = Array.isArray(lngs) ? lngs : [lngs];
      languages.forEach(lng => logMissingTranslation(key, lng));
    },
  });

// Apply initial direction based on saved language
const savedLang = localStorage.getItem('i18nextLng') || 'en';
document.documentElement.dir = isRTLLanguage(savedLang) ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

// Listen for language changes and update document direction
i18n.on('languageChanged', (lng) => {
  const isRTL = isRTLLanguage(lng);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  // Persist language choice
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;