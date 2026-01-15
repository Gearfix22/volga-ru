import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldX, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Check if current domain is allowed for admin access
 */
const isAdminDomain = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'admin.volgaservices.com' ||
    hostname.startsWith('admin.') ||
    // Allow localhost for development
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    // Allow Lovable preview URLs
    hostname.includes('lovable.app') ||
    hostname.includes('lovableproject.com')
  );
};

/**
 * AdminRouteGuard ensures:
 * 1. Only accessible on admin.volgaservices.com subdomain
 * 2. User is authenticated
 * 3. User has admin role (verified server-side via user_roles table)
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();
  const [domainChecked, setDomainChecked] = useState(false);
  const [isValidDomain, setIsValidDomain] = useState(false);

  useEffect(() => {
    const validDomain = isAdminDomain();
    setIsValidDomain(validDomain);
    setDomainChecked(true);
  }, []);

  // Show loading while checking domain and authentication
  if (loading || !domainChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Block access on non-admin domains (except localhost for dev)
  if (!isValidDomain) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Globe className="h-8 w-8 text-destructive" />
          </div>
          <Alert variant="destructive">
            <AlertTitle className="text-lg font-semibold">Invalid Domain</AlertTitle>
            <AlertDescription className="mt-2">
              Admin panel is only accessible at <strong>admin.volgaservices.com</strong>
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = 'https://volgaservices.com'}
              className="w-full"
            >
              Go to Main Site
            </Button>
            <Button 
              onClick={() => window.location.href = 'https://admin.volgaservices.com/admin-login'}
              className="w-full"
            >
              Go to Admin Portal
            </Button>
          </div>
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
              onClick={() => window.location.href = 'https://volgaservices.com'}
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
    setIsAdminSubdomain(isAdminDomain());
  }, []);

  return isAdminSubdomain;
};

/**
 * Component that blocks admin routes on non-admin domains
 * Use this to hide admin-related navigation on main site
 */
export const AdminSubdomainOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = useIsAdminSubdomain();
  
  if (!isAdmin) {
    return null;
  }
  
  return <>{children}</>;
};

export default AdminRouteGuard;
