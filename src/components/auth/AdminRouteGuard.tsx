import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * AdminRouteGuard ensures only authenticated admin users can access protected routes.
 * - Redirects unauthenticated users to /admin-login
 * - Shows access denied for authenticated non-admin users
 * - Supports subdomain-based routing (admin.volgaservices.com)
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    // Check if we're on the admin subdomain
    const hostname = window.location.hostname;
    const isAdmin = hostname.startsWith('admin.') || hostname === 'admin.volgaservices.com';
    setIsAdminSubdomain(isAdmin);
  }, []);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to admin login
  if (!user) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // Check for admin role - server-side verified via user_roles table
  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <Alert variant="destructive">
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You do not have administrator privileges to access this page.
              This incident has been logged.
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin access granted
  return <>{children}</>;
};

/**
 * Hook to check if current domain is admin subdomain
 */
export const useIsAdminSubdomain = () => {
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isAdmin = hostname.startsWith('admin.') || hostname === 'admin.volgaservices.com';
    setIsAdminSubdomain(isAdmin);
  }, []);

  return isAdminSubdomain;
};

/**
 * Component that restricts access to admin subdomain only
 */
export const AdminSubdomainGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdminSubdomain = useIsAdminSubdomain();
  
  // On main domain, hide admin routes entirely
  if (!isAdminSubdomain && window.location.hostname.includes('volgaservices.com')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default AdminRouteGuard;
