import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface GuideRouteGuardProps {
  children: React.ReactNode;
}

export const GuideRouteGuard: React.FC<GuideRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/guide-login" replace />;
  }

  if (!hasRole('guide')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
