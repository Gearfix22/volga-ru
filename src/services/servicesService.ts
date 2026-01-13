import { supabase } from '@/integrations/supabase/client';
import type { ServiceType } from '@/types/service';

// Re-export types
export type { ServiceType };

export interface ServiceData {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  features: string[];
  base_price: number | null;
  currency: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  category_id: string | null;
}

// Map service row to ServiceData
const mapService = (s: any): ServiceData => ({
  id: s.id,
  type: s.type as ServiceType,
  name: s.name,
  description: s.description || '',
  features: s.features || [],
  base_price: s.base_price,
  currency: s.currency || 'USD',
  image_url: s.image_url,
  is_active: s.is_active ?? true,
  display_order: s.display_order ?? 0,
  category_id: s.category_id
});

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

// Get single service by ID
export const getServiceById = async (id: string): Promise<ServiceData | null> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching service:', error);
    return null;
  }

  return mapService(data);
};

// Get service by type (first active match)
export const getServiceByType = async (type: string): Promise<ServiceData | null> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return mapService(data);
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
  
  // Map to labels
  const typeLabels: Record<string, string> = {
    'Driver': 'Transportation',
    'Accommodation': 'Accommodation',
    'Events': 'Activities & Events',
    'Guide': 'Tourist Guide'
  };

  return [
    { id: 'all', label: 'All Services' },
    ...uniqueTypes.map(type => ({
      id: type,
      label: typeLabels[type] || type
    }))
  ];
};

// Static fallback for service categories
export const getServiceCategories = (): { id: string; label: string }[] => {
  return [
    { id: 'all', label: 'All Services' },
    { id: 'Driver', label: 'Transportation' },
    { id: 'Accommodation', label: 'Accommodation' },
    { id: 'Events', label: 'Activities & Events' },
    { id: 'Guide', label: 'Tourist Guide' }
  ];
};

// Helper to get pricing display text
export const getPricingText = (service: ServiceData): string => {
  if (service.base_price && service.base_price > 0) {
    const currencySymbol = service.currency === 'USD' ? '$' : service.currency;
    if (service.type === 'Guide') {
      return `From ${currencySymbol}${service.base_price}/hr`;
    }
    return `From ${currencySymbol}${service.base_price}`;
  }
  return 'Quote by admin';
};
