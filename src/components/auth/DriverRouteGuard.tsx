import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DriverRouteGuardProps {
  children: React.ReactNode;
}

/**
 * DriverRouteGuard ensures only authenticated driver users can access protected routes.
 */
export const DriverRouteGuard: React.FC<DriverRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/auth?role=driver" state={{ from: location }} replace />;
  }

  if (!hasRole('driver')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <Alert variant="destructive">
            <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You do not have driver privileges to access this page.
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
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DriverRouteGuard;
