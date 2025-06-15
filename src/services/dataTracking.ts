
import { supabase } from '@/lib/supabase';

// Page visit tracking
export const trackPageVisit = async (pageUrl: string, pageTitle?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
    
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', sessionId);
    }

    const { error } = await supabase
      .from('page_visits')
      .insert({
        user_id: user?.id || null,
        page_url: pageUrl,
        page_title: pageTitle || document.title,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      });

    if (error) {
      console.error('Error tracking page visit:', error);
    }
  } catch (error) {
    console.error('Error in trackPageVisit:', error);
  }
};

// Form interaction tracking
export const trackFormInteraction = async (
  formType: string,
  interactionType: 'started' | 'field_changed' | 'submitted' | 'abandoned',
  formData: any,
  fieldName?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = sessionStorage.getItem('session_id') || generateSessionId();

    const { error } = await supabase
      .from('form_interactions')
      .insert({
        user_id: user?.id || null,
        form_type: formType,
        form_data: formData,
        interaction_type: interactionType,
        field_name: fieldName || null,
        session_id: sessionId
      });

    if (error) {
      console.error('Error tracking form interaction:', error);
    }
  } catch (error) {
    console.error('Error in trackFormInteraction:', error);
  }
};

// Search query tracking
export const trackSearchQuery = async (queryText: string, searchType?: string, resultsCount?: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = sessionStorage.getItem('session_id') || generateSessionId();

    const { error } = await supabase
      .from('search_queries')
      .insert({
        user_id: user?.id || null,
        query_text: queryText,
        search_type: searchType || null,
        results_count: resultsCount || null,
        session_id: sessionId
      });

    if (error) {
      console.error('Error tracking search query:', error);
    }
  } catch (error) {
    console.error('Error in trackSearchQuery:', error);
  }
};

// User preferences
export const saveUserPreference = async (preferenceType: string, preferenceValue: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('User not authenticated, saving preference to localStorage');
      localStorage.setItem(`pref_${preferenceType}`, JSON.stringify(preferenceValue));
      return;
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preference_type: preferenceType,
        preference_value: preferenceValue
      });

    if (error) {
      console.error('Error saving user preference:', error);
    }
  } catch (error) {
    console.error('Error in saveUserPreference:', error);
  }
};

// Contact form submission
export const submitContactForm = async (contactData: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert(contactData)
      .select()
      .single();

    if (error) {
      console.error('Error submitting contact form:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in submitContactForm:', error);
    throw error;
  }
};

// Newsletter subscription
export const subscribeToNewsletter = async (email: string, name?: string, source?: string) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        name: name || null,
        subscription_source: source || 'website'
      })
      .select()
      .single();

    if (error) {
      console.error('Error subscribing to newsletter:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in subscribeToNewsletter:', error);
    throw error;
  }
};

// Utility function to generate session ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get user preferences
export const getUserPreferences = async (preferenceType?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return preferences from localStorage if user not authenticated
      if (preferenceType) {
        const pref = localStorage.getItem(`pref_${preferenceType}`);
        return pref ? JSON.parse(pref) : null;
      }
      return null;
    }

    let query = supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id);

    if (preferenceType) {
      query = query.eq('preference_type', preferenceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }

    return preferenceType ? data[0]?.preference_value : data;
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return null;
  }
};
