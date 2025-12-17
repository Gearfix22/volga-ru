import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerRouteGuardProps {
  children: React.ReactNode;
}

/**
 * CustomerRouteGuard blocks users with ONLY driver role from accessing customer pages.
 * Drivers should be redirected to their dashboard, not customer-facing pages.
 */
export const CustomerRouteGuard: React.FC<CustomerRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole, userRoles } = useAuth();
  const location = useLocation();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // If user is authenticated and has ONLY driver role (not admin or user), redirect to driver dashboard
  if (user && userRoles.length > 0) {
    const isOnlyDriver = hasRole('driver') && !hasRole('admin') && !hasRole('user');
    
    if (isOnlyDriver) {
      return <Navigate to="/driver-dashboard" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default CustomerRouteGuard;
