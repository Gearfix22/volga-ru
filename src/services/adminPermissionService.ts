import { supabase } from '@/integrations/supabase/client';

export type AdminPermission = 
  | 'users_create'
  | 'users_delete'
  | 'users_view'
  | 'users_edit'
  | 'bookings_view'
  | 'bookings_edit'
  | 'payments_view'
  | 'payments_edit'
  | 'drivers_manage'
  | 'settings_manage'
  | 'full_access';

export interface AdminPermissions {
  id: string;
  user_id: string;
  permissions: AdminPermission[];
  created_at: string;
  updated_at: string;
}

/**
 * Get permissions for current admin user
 */
export async function getMyPermissions(): Promise<AdminPermission[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('admin_permissions')
    .select('permissions')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If no permissions record, might be a super admin or legacy admin
    console.log('No permissions record found, checking role');
    return ['full_access']; // Default for legacy admins
  }

  return (data?.permissions as AdminPermission[]) || [];
}

/**
 * Check if current admin has a specific permission
 */
export async function hasPermission(permission: AdminPermission): Promise<boolean> {
  const permissions = await getMyPermissions();
  return permissions.includes('full_access') || permissions.includes(permission);
}

/**
 * Check multiple permissions at once
 */
export async function hasAnyPermission(requiredPermissions: AdminPermission[]): Promise<boolean> {
  const permissions = await getMyPermissions();
  if (permissions.includes('full_access')) return true;
  return requiredPermissions.some(p => permissions.includes(p));
}

/**
 * Get all admin permissions (for super admin)
 */
export async function getAllAdminPermissions(): Promise<AdminPermissions[]> {
  const { data, error } = await supabase
    .from('admin_permissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin permissions:', error);
    return [];
  }

  return data as AdminPermissions[];
}

/**
 * Set admin permissions (super admin only)
 */
export async function setAdminPermissions(
  userId: string,
  permissions: AdminPermission[]
): Promise<boolean> {
  const { error } = await supabase
    .from('admin_permissions')
    .upsert({
      user_id: userId,
      permissions,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error setting admin permissions:', error);
    return false;
  }

  return true;
}

/**
 * Remove admin permissions
 */
export async function removeAdminPermissions(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('admin_permissions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing admin permissions:', error);
    return false;
  }

  return true;
}

/**
 * Permission labels for UI
 */
export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  users_create: 'Create Users',
  users_delete: 'Delete Users',
  users_view: 'View Users',
  users_edit: 'Edit Users',
  bookings_view: 'View Bookings',
  bookings_edit: 'Edit Bookings',
  payments_view: 'View Payments',
  payments_edit: 'Edit Payments',
  drivers_manage: 'Manage Drivers',
  settings_manage: 'Manage Settings',
  full_access: 'Full Access (Super Admin)'
};
