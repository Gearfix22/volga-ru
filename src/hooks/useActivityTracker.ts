import { useCallback } from 'react';
import { trackUserAction } from '@/services/userActivityService';

export const useActivityTracker = () => {
  const trackAction = useCallback(async (action: string, details?: any) => {
    await trackUserAction(action, details);
  }, []);

  const trackPageView = useCallback(async (page: string, details?: any) => {
    await trackUserAction('page_viewed', { page, ...details });
  }, []);

  const trackServiceView = useCallback(async (serviceType: string, details?: any) => {
    await trackUserAction('service_viewed', { service_type: serviceType, ...details });
  }, []);

  const trackFormSubmission = useCallback(async (formType: string, details?: any) => {
    await trackUserAction('form_submitted', { form_type: formType, ...details });
  }, []);

  const trackPaymentAction = useCallback(async (action: 'initiated' | 'completed' | 'failed', details?: any) => {
    await trackUserAction(`payment_${action}`, details);
  }, []);

  const trackProfileUpdate = useCallback(async (details?: any) => {
    await trackUserAction('profile_updated', details);
  }, []);

  const trackLanguageChange = useCallback(async (language: string) => {
    await trackUserAction('language_changed', { language });
  }, []);

  return {
    trackAction,
    trackPageView,
    trackServiceView,
    trackFormSubmission,
    trackPaymentAction,
    trackProfileUpdate,
    trackLanguageChange
  };
};