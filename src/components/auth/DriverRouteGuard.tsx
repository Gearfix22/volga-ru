import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface DriverRouteGuardProps {
  children: React.ReactNode;
}

/**
 * DriverRouteGuard ensures only authenticated users with driver role can access driver routes.
 * Waits for roles to be fetched before making access decisions.
 */
export const DriverRouteGuard: React.FC<DriverRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole, userRoles } = useAuth();
  const location = useLocation();
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);

  useEffect(() => {
    // Wait for roles to be fetched after auth state change
    if (!loading && user) {
      const timer = setTimeout(() => {
        setIsCheckingRoles(false);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!loading && !user) {
      setIsCheckingRoles(false);
    }
  }, [loading, user, userRoles]);

  // Show loading while checking auth or roles
  if (loading || (user && isCheckingRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying driver access...</p>
        </div>
      </div>
    );
  }

  // Redirect to driver login if not authenticated
  if (!user) {
    return <Navigate to="/driver-login" state={{ from: location }} replace />;
  }

  // If user doesn't have driver role, redirect to driver login
  if (!hasRole('driver')) {
    return <Navigate to="/driver-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default DriverRouteGuard;
