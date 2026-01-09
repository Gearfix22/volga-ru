import { supabase } from '@/integrations/supabase/client';
import type { 
  Service, 
  ServiceCategory, 
  CreateServicePayload, 
  UpdateServicePayload 
} from '@/types/service';

// Re-export types for backward compatibility
export type { Service, ServiceCategory };

// Log admin action helper
async function logAdminAction(actionType: string, targetId: string | null, targetTable: string, payload: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action_type: actionType,
      target_id: targetId,
      target_table: targetTable,
      payload
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// Get all services (admin)
export async function getAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    throw new Error(`Failed to fetch services: ${error.message}`);
  }

  return (data || []) as Service[];
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
// CRITICAL: Only use columns that exist in services table:
// name, type, description, base_price, image_url, features, is_active, category_id, display_order
// Do NOT use: price, status (these columns don't exist)
export async function createService(payload: CreateServicePayload): Promise<Service> {
  // Validate required fields
  if (!payload.name?.trim()) {
    throw new Error('Service name is required');
  }
  if (!payload.type) {
    throw new Error('Service type is required');
  }

  // Build insert payload with ONLY valid columns
  const insertData = {
    name: payload.name.trim(),
    type: payload.type,
    description: payload.description ?? null,
    base_price: payload.base_price ?? null,
    image_url: payload.image_url ?? null,
    features: payload.features ?? null,
    is_active: payload.is_active ?? true,
    category_id: payload.category_id ?? null,
    display_order: payload.display_order ?? 0
  };

  const { data, error } = await supabase
    .from('services')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Supabase create service error:', error);
    throw new Error(`Failed to create service: ${error.message}`);
  }

  if (!data) {
    throw new Error('Service created but no data returned');
  }

  await logAdminAction('service_created', data.id, 'services', { name: payload.name });
  return data as Service;
}

// Update service (admin)
export async function updateService(serviceId: string, updates: UpdateServicePayload): Promise<boolean> {
  // Build update payload with ONLY valid columns
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.base_price !== undefined) updateData.base_price = updates.base_price;
  if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
  if (updates.features !== undefined) updateData.features = updates.features;
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
  if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
  if (updates.display_order !== undefined) updateData.display_order = updates.display_order;

  const { error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', serviceId);

  if (error) {
    console.error('Supabase update service error:', error);
    throw new Error(`Failed to update service: ${error.message}`);
  }

  await logAdminAction('service_updated', serviceId, 'services', updates);
  return true;
}

// Delete service (admin)
export async function deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error('Supabase delete service error:', error);
    return { success: false, error: error.message };
  }

  await logAdminAction('service_deleted', serviceId, 'services', {});
  return { success: true };
}

// Toggle service active status
export async function toggleServiceStatus(serviceId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', serviceId);

  if (error) {
    console.error('Supabase toggle service status error:', error);
    return { success: false, error: error.message };
  }

  await logAdminAction(isActive ? 'service_activated' : 'service_deactivated', serviceId, 'services', {});
  return { success: true };
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
