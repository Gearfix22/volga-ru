/**
 * Service Types - Single Source of Truth
 * Aligned with Supabase public.services table schema
 */

// Valid service types from the database - extensible via admin panel
export type ServiceType = 'Driver' | 'Accommodation' | 'Events' | 'Guide' | string;

// Service interface matching Supabase services table exactly
export interface Service {
  id: string;
  name: string;
  type: string; // Required, non-null in DB
  description: string | null;
  base_price: number | null;
  currency: string; // Currency for base_price (USD, EUR, etc.)
  image_url: string | null;
  features: string[] | null;
  is_active: boolean;
  category_id: string | null;
  display_order: number;
  service_type: string | null; // Legacy column, may be removed
  created_at: string | null;
  updated_at: string | null;
}

// Service category interface matching Supabase service_categories table
export interface ServiceCategory {
  id: string;
  category_name: string;
  description: string | null;
  icon_name: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

// Payload for creating a new service (omit auto-generated fields)
export interface CreateServicePayload {
  name: string;
  type: string; // REQUIRED - must not be empty
  description?: string | null;
  base_price?: number | null;
  currency?: string; // Currency for base_price
  image_url?: string | null;
  features?: string[] | null;
  is_active?: boolean;
  category_id?: string | null;
  display_order?: number;
}

// Payload for updating a service
export type UpdateServicePayload = Partial<CreateServicePayload>;

// Service form data for UI
export interface ServiceFormData {
  name: string;
  type: string;
  description: string;
  base_price: number;
  currency: string;
  image_url: string;
  features: string;
  is_active: boolean;
  category_id: string;
  display_order: number;
}

// Default form values
export const DEFAULT_SERVICE_FORM: ServiceFormData = {
  name: '',
  type: '',
  description: '',
  base_price: 0,
  currency: 'USD',
  image_url: '',
  features: '',
  is_active: true,
  category_id: '',
  display_order: 0
};

// Valid service types for select dropdowns
export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'Driver', label: 'Transportation' },
  { value: 'Accommodation', label: 'Accommodation' },
  { value: 'Events', label: 'Events & Activities' },
  { value: 'Guide', label: 'Tourist Guide' }
];

// Validate service payload before submission
export function validateServicePayload(data: ServiceFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Service name is required');
  }
  
  if (!data.type) {
    errors.push('Service type is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Convert form data to API payload
export function formToPayload(data: ServiceFormData): CreateServicePayload {
  return {
    name: data.name.trim(),
    type: data.type, // REQUIRED
    description: data.description?.trim() || null,
    base_price: data.base_price > 0 ? data.base_price : null,
    currency: data.currency || 'USD',
    image_url: data.image_url?.trim() || null,
    features: data.features 
      ? data.features.split(',').map(f => f.trim()).filter(Boolean) 
      : null,
    is_active: data.is_active,
    category_id: data.category_id || null,
    display_order: data.display_order
  };
}

// Convert service to form data
export function serviceToForm(service: Service, defaultOrder: number = 0): ServiceFormData {
  return {
    name: service.name,
    type: service.type,
    description: service.description || '',
    base_price: service.base_price || 0,
    currency: service.currency || 'USD',
    image_url: service.image_url || '',
    features: service.features?.join(', ') || '',
    is_active: service.is_active,
    category_id: service.category_id || '',
    display_order: service.display_order ?? defaultOrder
  };
}
