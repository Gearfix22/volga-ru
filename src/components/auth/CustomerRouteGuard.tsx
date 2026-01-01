import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface CustomerRouteGuardProps {
  children: React.ReactNode;
}

/**
 * CustomerRouteGuard blocks users with ONLY driver/guide role from accessing customer pages.
 * Drivers/Guides should be redirected to their dashboard, not customer-facing pages.
 */
export const CustomerRouteGuard: React.FC<CustomerRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole, userRoles } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow unauthenticated users (public pages)
  if (!user) {
    return <>{children}</>;
  }

  // If user is authenticated and has ONLY driver role (not admin or user), redirect to driver dashboard
  if (userRoles.length > 0) {
    const isOnlyDriver = hasRole('driver') && !hasRole('admin') && !hasRole('user') && !hasRole('guide');
    const isOnlyGuide = hasRole('guide') && !hasRole('admin') && !hasRole('user') && !hasRole('driver');
    
    if (isOnlyDriver) {
      return <Navigate to="/driver-dashboard" state={{ from: location }} replace />;
    }
    
    if (isOnlyGuide) {
      return <Navigate to="/guide-dashboard" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default CustomerRouteGuard;
