/**
 * Hook to sync language preference with Supabase user profile
 * Ensures language preference persists across sessions and devices
 */

import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isRTLLanguage } from '@/i18n/config';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  /**
   * Load language preference from Supabase profile on login
   */
  const loadLanguagePreference = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading language preference:', error);
        return;
      }

      if (profile?.preferred_language && profile.preferred_language !== i18n.language) {
        await i18n.changeLanguage(profile.preferred_language);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  }, [user, i18n]);

  /**
   * Save language preference to Supabase profile
   */
  const saveLanguagePreference = useCallback(async (language: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferred_language: language,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving language preference:', error);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, [user]);

  /**
   * Change language and sync with Supabase
   */
  const changeLanguage = useCallback(async (language: string) => {
    // Change language locally
    await i18n.changeLanguage(language);
    
    // Update document direction
    const isRTL = isRTLLanguage(language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Persist to localStorage
    localStorage.setItem('i18nextLng', language);
    
    // Sync with Supabase if user is logged in
    if (user) {
      await saveLanguagePreference(language);
    }
  }, [i18n, user, saveLanguagePreference]);

  // Load language preference when user logs in
  useEffect(() => {
    if (user) {
      loadLanguagePreference();
    }
  }, [user, loadLanguagePreference]);

  // Listen for language changes and sync
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      // Apply RTL/LTR immediately
      const isRTL = isRTLLanguage(lng);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
      
      // Add/remove RTL class for additional styling hooks
      if (isRTL) {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    // Apply initial direction
    handleLanguageChange(i18n.language);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return {
    language: i18n.language,
    changeLanguage,
    isRTL: isRTLLanguage(i18n.language),
    loadLanguagePreference,
  };
};

export default useLanguageSync;
