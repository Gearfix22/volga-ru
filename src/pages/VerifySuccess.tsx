import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const VerifySuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'already_verified'>('success');

  useEffect(() => {
    const handleVerification = async () => {
      // Check for token in URL (Supabase email verification)
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      // Small delay to ensure Supabase has processed the verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check current auth state
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        setVerificationStatus('success');
      } else if (token && type === 'signup') {
        // Token exists but verification may have failed
        setVerificationStatus('error');
      } else {
        // No token - user navigated here directly
        setVerificationStatus('already_verified');
      }
      
      setIsVerifying(false);
    };

    handleVerification();
  }, [searchParams]);

  const handleContinueToLogin = () => {
    navigate('/auth', { replace: true });
  };

  if (isVerifying) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-muted-foreground">{t('auth.verifying') || 'Verifying...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <AnimatedBackground />
      
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            {verificationStatus === 'success' || verificationStatus === 'already_verified' ? (
              <CheckCircle className="h-10 w-10 text-white" />
            ) : (
              <Mail className="h-10 w-10 text-white" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {verificationStatus === 'success' && (t('auth.emailVerified') || 'Email Verified!')}
            {verificationStatus === 'already_verified' && (t('auth.accountReady') || 'Account Ready')}
            {verificationStatus === 'error' && (t('auth.verificationFailed') || 'Verification Issue')}
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            {verificationStatus === 'success' && (
              t('auth.emailVerifiedDesc') || 'Your email has been successfully verified. You can now sign in to your account.'
            )}
            {verificationStatus === 'already_verified' && (
              t('auth.accountReadyDesc') || 'Your account is ready. Please sign in to continue.'
            )}
            {verificationStatus === 'error' && (
              t('auth.verificationFailedDesc') || 'There was an issue verifying your email. Please try signing in or request a new verification email.'
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Success visual */}
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {t('auth.readyToUse') || 'Your account is ready to use'}
              </span>
            </div>
          </div>
          
          {/* What's next */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t('auth.whatsNext') || "What's next?"}</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>{t('auth.nextStep1') || 'Sign in with your email and password'}</li>
              <li>{t('auth.nextStep2') || 'Browse our premium services'}</li>
              <li>{t('auth.nextStep3') || 'Create your first booking'}</li>
            </ul>
          </div>
          
          {/* CTA Button */}
          <Button 
            onClick={handleContinueToLogin}
            className="w-full h-12 text-base font-semibold gap-2"
            size="lg"
          >
            {t('auth.continueToSignIn') || 'Continue to Sign In'}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifySuccess;
