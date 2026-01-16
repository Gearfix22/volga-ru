import { supabase } from '@/integrations/supabase/client';
import type { ServiceType } from '@/types/service';

// Re-export types
export type { ServiceType };

export interface ServiceData {
  id: string;
  type: ServiceType;
  name: string;
  name_en: string | null;
  name_ar: string | null;
  name_ru: string | null;
  description: string;
  description_en: string | null;
  description_ar: string | null;
  description_ru: string | null;
  features: string[];
  base_price: number | null;
  currency: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  category_id: string | null;
}

// Map service row to ServiceData - fully dynamic from DB
const mapService = (s: any): ServiceData => ({
  id: s.id,
  type: s.type as ServiceType,
  name: s.name,
  name_en: s.name_en,
  name_ar: s.name_ar,
  name_ru: s.name_ru,
  description: s.description || '',
  description_en: s.description_en,
  description_ar: s.description_ar,
  description_ru: s.description_ru,
  features: s.features || [],
  base_price: s.base_price,
  currency: s.currency || 'USD',
  image_url: s.image_url,
  is_active: s.is_active ?? true,
  display_order: s.display_order ?? 0,
  category_id: s.category_id
});

// Get localized service name
export const getLocalizedServiceName = (service: ServiceData, language: string): string => {
  switch (language) {
    case 'ar':
      return service.name_ar || service.name;
    case 'ru':
      return service.name_ru || service.name;
    default:
      return service.name_en || service.name;
  }
};

// Get localized service description
export const getLocalizedServiceDescription = (service: ServiceData, language: string): string => {
  switch (language) {
    case 'ar':
      return service.description_ar || service.description;
    case 'ru':
      return service.description_ru || service.description;
    default:
      return service.description_en || service.description;
  }
};

// Get service by ID - for booking flow
export const getServiceById = async (id: string): Promise<ServiceData | null> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching service by ID:', error);
    return null;
  }

  return mapService(data);
};

// Get service by type - for backward compatibility with booking flow
export const getServiceByType = async (type: string): Promise<ServiceData | null> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapService(data);
};

// Get all active services - ALWAYS from Supabase (no cache, no fallback)
export const getServices = async (): Promise<ServiceData[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return (data || []).map(mapService);
};

// Get all services including inactive (for admin)
export const getAllServicesAdmin = async (): Promise<ServiceData[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching all services:', error);
    return [];
  }

  return (data || []).map(mapService);
};

// Get services by type
export const getServicesByType = async (type: ServiceType): Promise<ServiceData[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching services by type:', error);
    return [];
  }

  return (data || []).map(mapService);
};

// Get unique service categories dynamically from database
export const getServiceCategoriesDynamic = async (): Promise<{ id: string; label: string }[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('type')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching service categories:', error);
    return [{ id: 'all', label: 'All Services' }];
  }

  // Get unique types
  const uniqueTypes = [...new Set((data || []).map(s => s.type))];
  
  // Return raw types - localization happens in the component
  return [
    { id: 'all', label: 'All Services' },
    ...uniqueTypes.map(type => ({
      id: type,
      label: type // Will be localized in the component
    }))
  ];
};

// Static fallback for service categories (deprecated - use dynamic)
export const getServiceCategories = (): { id: string; label: string }[] => {
  return [
    { id: 'all', label: 'All Services' },
    { id: 'Driver', label: 'Transportation' },
    { id: 'Accommodation', label: 'Accommodation' },
    { id: 'Events', label: 'Activities & Events' },
    { id: 'Guide', label: 'Tourist Guide' }
  ];
};

// Helper to get pricing display text - now with i18n support
export const getPricingText = (service: ServiceData, t?: (key: string, options?: any) => string): string => {
  if (service.base_price && service.base_price > 0) {
    const currencySymbol = service.currency === 'USD' ? '$' : service.currency;
    if (service.type === 'Guide') {
      return t ? t('services.fromPricePerHour', { price: `${currencySymbol}${service.base_price}` }) : `From ${currencySymbol}${service.base_price}/hr`;
    }
    return t ? t('services.fromPrice', { price: `${currencySymbol}${service.base_price}` }) : `From ${currencySymbol}${service.base_price}`;
  }
  return t ? t('services.quoteByAdmin') : 'Quote by admin';
};
