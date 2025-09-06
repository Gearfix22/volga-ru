import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, User, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthRequiredWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthRequiredWrapper: React.FC<AuthRequiredWrapperProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // If auth is not required, just render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, render children
  if (user) {
    return <>{children}</>;
  }

  // If not authenticated, show login required screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t('auth.loginRequired')}</CardTitle>
              <CardDescription className="text-base">
                {t('auth.loginRequiredDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t('auth.secureBookingDescription')}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">{t('auth.benefitsTitle')}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('auth.trackBookings')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('auth.securePayments')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('auth.resumeBookings')}
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full"
                size="lg"
              >
                {t('auth.signInOrSignUp')}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('auth.quickRegistration')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};