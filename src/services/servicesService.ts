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
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  category_id: string | null;
}

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

  return (data || []).map(s => ({
    id: s.id,
    type: s.type as ServiceType,
    name: s.name,
    description: s.description || '',
    features: s.features || [],
    base_price: s.base_price,
    image_url: s.image_url,
    is_active: s.is_active ?? true,
    display_order: s.display_order ?? 0,
    category_id: s.category_id
  }));
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

  return (data || []).map(s => ({
    id: s.id,
    type: s.type as ServiceType,
    name: s.name,
    description: s.description || '',
    features: s.features || [],
    base_price: s.base_price,
    image_url: s.image_url,
    is_active: s.is_active ?? true,
    display_order: s.display_order ?? 0,
    category_id: s.category_id
  }));
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

  return {
    id: data.id,
    type: data.type as ServiceType,
    name: data.name,
    description: data.description || '',
    features: data.features || [],
    base_price: data.base_price,
    image_url: data.image_url,
    is_active: data.is_active ?? true,
    display_order: data.display_order ?? 0,
    category_id: data.category_id
  };
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

  return (data || []).map(s => ({
    id: s.id,
    type: s.type as ServiceType,
    name: s.name,
    description: s.description || '',
    features: s.features || [],
    base_price: s.base_price,
    image_url: s.image_url,
    is_active: s.is_active ?? true,
    display_order: s.display_order ?? 0,
    category_id: s.category_id
  }));
};

// Get service categories for tabs
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
  if (service.type === 'Driver') {
    return `From $${service.base_price || 50} USD`;
  }
  if (service.type === 'Guide') {
    return `From $${service.base_price || 50}/hr`;
  }
  return 'Quote by admin';
};
