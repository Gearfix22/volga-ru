import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface UserRouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * UserRouteGuard ensures only authenticated users can access protected routes.
 * Optionally restricts access to specific roles.
 */
export const UserRouteGuard: React.FC<UserRouteGuardProps> = ({ 
  children, 
  allowedRoles = ['user', 'admin']
}) => {
  const { user, loading, hasRole } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('common.verifyingAccess')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => hasRole(role));
  
  if (!hasAllowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default UserRouteGuard;
