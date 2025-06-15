
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackPageVisit, 
  trackFormInteraction, 
  trackSearchQuery, 
  saveUserPreference,
  getUserPreferences 
} from '@/services/dataTracking';

export const useDataTracking = () => {
  const location = useLocation();

  // Track page visits automatically
  useEffect(() => {
    trackPageVisit(location.pathname + location.search, document.title);
  }, [location]);

  const trackForm = useCallback((
    formType: string,
    interactionType: 'started' | 'field_changed' | 'submitted' | 'abandoned',
    formData: any,
    fieldName?: string
  ) => {
    trackFormInteraction(formType, interactionType, formData, fieldName);
  }, []);

  const trackSearch = useCallback((queryText: string, searchType?: string, resultsCount?: number) => {
    trackSearchQuery(queryText, searchType, resultsCount);
  }, []);

  const savePreference = useCallback((preferenceType: string, preferenceValue: any) => {
    saveUserPreference(preferenceType, preferenceValue);
  }, []);

  const getPreferences = useCallback((preferenceType?: string) => {
    return getUserPreferences(preferenceType);
  }, []);

  return {
    trackForm,
    trackSearch,
    savePreference,
    getPreferences
  };
};
