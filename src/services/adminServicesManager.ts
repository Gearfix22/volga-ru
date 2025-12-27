import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from './adminService';

export interface Service {
  id: string;
  name: string;
  type: string;
  description: string | null;
  base_price: number | null;
  image_url: string | null;
  features: string[] | null;
  is_active: boolean;
  category_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  category_name: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Get all services (admin)
export async function getAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data as Service[];
}

// Get active services (public)
export async function getActiveServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching active services:', error);
    return [];
  }

  return data as Service[];
}

// Get service by ID
export async function getServiceById(serviceId: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    return null;
  }

  return data as Service;
}

// Create service (admin)
export async function createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    return null;
  }

  await logAdminAction('service_created', data.id, 'services', { name: service.name });
  return data as Service;
}

// Update service (admin)
export async function updateService(serviceId: string, updates: Partial<Service>): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', serviceId);

  if (error) {
    console.error('Error updating service:', error);
    return false;
  }

  await logAdminAction('service_updated', serviceId, 'services', updates);
  return true;
}

// Delete service (admin)
export async function deleteService(serviceId: string): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error('Error deleting service:', error);
    return false;
  }

  await logAdminAction('service_deleted', serviceId, 'services', {});
  return true;
}

// Toggle service active status
export async function toggleServiceStatus(serviceId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', serviceId);

  if (error) {
    console.error('Error toggling service status:', error);
    return false;
  }

  await logAdminAction(isActive ? 'service_activated' : 'service_deactivated', serviceId, 'services', {});
  return true;
}

// Reorder services
export async function reorderServices(serviceOrders: { id: string; display_order: number }[]): Promise<boolean> {
  for (const order of serviceOrders) {
    const { error } = await supabase
      .from('services')
      .update({ display_order: order.display_order })
      .eq('id', order.id);

    if (error) {
      console.error('Error reordering services:', error);
      return false;
    }
  }

  await logAdminAction('services_reordered', null, 'services', { orders: serviceOrders });
  return true;
}

// Get all categories
export async function getAllCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data as ServiceCategory[];
}

// Create category (admin)
export async function createCategory(category: Omit<ServiceCategory, 'id' | 'created_at'>): Promise<ServiceCategory | null> {
  const { data, error } = await supabase
    .from('service_categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  await logAdminAction('category_created', data.id, 'service_categories', { name: category.category_name });
  return data as ServiceCategory;
}

// Update category (admin)
export async function updateCategory(categoryId: string, updates: Partial<ServiceCategory>): Promise<boolean> {
  const { error } = await supabase
    .from('service_categories')
    .update(updates)
    .eq('id', categoryId);

  if (error) {
    console.error('Error updating category:', error);
    return false;
  }

  await logAdminAction('category_updated', categoryId, 'service_categories', updates);
  return true;
}

// Delete category (admin)
export async function deleteCategory(categoryId: string): Promise<boolean> {
  // First, unassign services from this category
  await supabase
    .from('services')
    .update({ category_id: null })
    .eq('category_id', categoryId);

  const { error } = await supabase
    .from('service_categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }

  await logAdminAction('category_deleted', categoryId, 'service_categories', {});
  return true;
}
