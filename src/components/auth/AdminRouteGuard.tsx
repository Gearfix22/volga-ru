import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * AdminRouteGuard ensures:
 * 1. User is authenticated
 * 2. User has admin role (verified server-side via user_roles table)
 * 
 * MOBILE-FIRST: No domain-based restrictions - uses pure role-based authorization
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole } = useAuth();
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-background ${isRTL ? 'rtl' : ''}`}>
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('common.verifyingAccess')}</p>
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
      <div className={`flex items-center justify-center min-h-screen bg-background p-4 ${isRTL ? 'rtl' : ''}`}>
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <Alert variant="destructive">
            <AlertTitle className="text-lg font-semibold">{t('dashboard.accessDenied')}</AlertTitle>
            <AlertDescription className="mt-2">
              {t('dashboard.noPermission')}
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              {t('staffLogin.backToHome')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('staffLogin.contactAdmin')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin access granted
  return <>{children}</>
};

/**
 * Hook to check if user has admin access
 * MOBILE-FIRST: Uses role-based auth, not domain checks
 */
export const useIsAdminUser = () => {
  const { hasRole, loading } = useAuth();
  return { isAdmin: hasRole('admin'), loading };
};

/**
 * Component that only renders children for admin users
 * Use this to hide admin-related navigation
 */
export const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useIsAdminUser();
  
  if (loading || !isAdmin) {
    return null;
  }
  
  return <>{children}</>;
};

// Legacy exports for backward compatibility
export const useIsAdminSubdomain = useIsAdminUser;
export const AdminSubdomainOnly = AdminOnly;

export default AdminRouteGuard;
