import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTLLanguage, SUPPORTED_LANGUAGES, SupportedLanguage, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/i18n/config';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { keyToReadableFallback } from '@/utils/safeTranslate';

export type Language = SupportedLanguage;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
  isRTL: boolean;
  languages: typeof SUPPORTED_LANGUAGES;
  getLanguageName: (code: Language) => string;
  getLanguageFlag: (code: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: rawT, i18n } = useTranslation('common');
  const { user } = useAuth();
  
  const currentLanguage = (i18n.language || 'en') as Language;
  const isRTL = isRTLLanguage(currentLanguage);

  // SAFE TRANSLATION FUNCTION - Never returns raw keys
  const t = useMemo(() => {
    return (key: string, options?: any): string => {
      try {
        const result = rawT(key, options);
        const resultStr = typeof result === 'string' ? result : String(result);
        
        // Check if result looks like a raw key (contains dots and matches key pattern)
        if (resultStr === key || (resultStr.includes('.') && /^[a-z]+\.[a-zA-Z.]+$/.test(resultStr))) {
          // Return a human-readable fallback instead of the raw key
          return keyToReadableFallback(key);
        }
        
        return resultStr;
      } catch (error) {
        console.error(`[LanguageContext] Translation error for key "${key}":`, error);
        return keyToReadableFallback(key);
      }
    };
  }, [rawT]);

  // Sync language preference with Supabase profile
  const syncLanguageToProfile = useCallback(async (lang: Language) => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ 
          preferred_language: lang,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error syncing language preference:', error);
    }
  }, [user]);

  // Load language preference from profile on login
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();
        
        if (profile?.preferred_language && 
            SUPPORTED_LANGUAGES.includes(profile.preferred_language as SupportedLanguage) &&
            profile.preferred_language !== i18n.language) {
          i18n.changeLanguage(profile.preferred_language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    
    loadLanguagePreference();
  }, [user, i18n]);

  const setLanguage = useCallback((lang: Language) => {
    i18n.changeLanguage(lang);
    syncLanguageToProfile(lang);
  }, [i18n, syncLanguageToProfile]);

  // Apply RTL/LTR direction to document
  useEffect(() => {
    const isCurrentRTL = isRTLLanguage(currentLanguage);
    document.documentElement.dir = isCurrentRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    
    // Add/remove RTL class for additional styling
    if (isCurrentRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [currentLanguage]);

  const getLanguageName = (code: Language): string => LANGUAGE_NAMES[code] || code;
  const getLanguageFlag = (code: Language): string => LANGUAGE_FLAGS[code] || '🌐';

  const value: LanguageContextType = {
    language: currentLanguage,
    setLanguage,
    t,
    isRTL,
    languages: SUPPORTED_LANGUAGES,
    getLanguageName,
    getLanguageFlag,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};