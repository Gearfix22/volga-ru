import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getMyPermissions, 
  hasPermission, 
  hasAnyPermission,
  AdminPermission 
} from '@/services/adminPermissionService';

export const useAdminPermissions = () => {
  const { user, hasRole } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user && hasRole('admin')) {
        setLoading(true);
        const perms = await getMyPermissions();
        setPermissions(perms);
        setLoading(false);
      } else {
        setPermissions([]);
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, hasRole]);

  const checkPermission = useCallback((permission: AdminPermission): boolean => {
    if (!hasRole('admin')) return false;
    return permissions.includes('full_access') || permissions.includes(permission);
  }, [permissions, hasRole]);

  const checkAnyPermission = useCallback((requiredPermissions: AdminPermission[]): boolean => {
    if (!hasRole('admin')) return false;
    if (permissions.includes('full_access')) return true;
    return requiredPermissions.some(p => permissions.includes(p));
  }, [permissions, hasRole]);

  const isSuperAdmin = permissions.includes('full_access');

  return {
    permissions,
    loading,
    checkPermission,
    checkAnyPermission,
    isSuperAdmin,
    // Convenience checks
    canViewUsers: checkPermission('users_view') || isSuperAdmin,
    canEditUsers: checkPermission('users_edit') || isSuperAdmin,
    canCreateUsers: checkPermission('users_create') || isSuperAdmin,
    canDeleteUsers: checkPermission('users_delete') || isSuperAdmin,
    canViewBookings: checkPermission('bookings_view') || isSuperAdmin,
    canEditBookings: checkPermission('bookings_edit') || isSuperAdmin,
    canViewPayments: checkPermission('payments_view') || isSuperAdmin,
    canEditPayments: checkPermission('payments_edit') || isSuperAdmin,
    canManageDrivers: checkPermission('drivers_manage') || isSuperAdmin,
    canManageSettings: checkPermission('settings_manage') || isSuperAdmin,
  };
};

export default useAdminPermissions;
