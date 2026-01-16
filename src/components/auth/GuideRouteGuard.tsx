import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface GuideRouteGuardProps {
  children: React.ReactNode;
}

export const GuideRouteGuard: React.FC<GuideRouteGuardProps> = ({ children }) => {
  const { user, loading, hasRole } = useAuth();
  const { t, isRTL } = useLanguage();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/guide-login" state={{ from: location }} replace />;
  }

  if (!hasRole('guide')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default GuideRouteGuard;
