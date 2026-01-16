import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Phone, Lock, Loader2, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const DriverLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, hasRole, updatePassword } = useAuth();
  const { t, isRTL } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resetRequestSent, setResetRequestSent] = useState(false);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
    
    if (user && hasRole('driver')) {
      navigate('/driver-dashboard', { replace: true });
    }
  }, [user, hasRole, navigate, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim() || !password.trim()) {
      toast.error(t('staffLogin.enterPhoneAndPassword'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('driver-login', {
        body: {
          phone: phone.replace(/\D/g, ''),
          password: password
        }
      });

      if (error) {
        toast.error(t('staffLogin.loginFailed'));
        return;
      }

      if (!data.success) {
        toast.error(data.error || t('staffLogin.invalidPhoneOrPassword'));
        return;
      }

      if (data.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        if (sessionError) {
          toast.error(t('staffLogin.failedEstablishSession'));
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.success(t('staffLogin.loginSuccessful'));
      navigate('/driver-dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || t('staffLogin.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast.error(t('staffLogin.pleaseEnterPhone'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-drivers', {
        body: {
          action: 'request_password_reset',
          phone: phone.replace(/\D/g, '')
        }
      });

      if (error) {
        toast.error(t('staffLogin.failedSubmitRequest'));
        return;
      }

      setResetRequestSent(true);
      toast.success(t('staffLogin.resetRequestSubmitted'));
    } catch (error: any) {
      toast.error(error.message || t('staffLogin.failedSubmitRequest'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error(t('staffLogin.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('staffLogin.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(error.message || t('staffLogin.failedUpdatePassword'));
        return;
      }

      toast.success(t('staffLogin.passwordUpdated'));
      setIsRecoveryMode(false);
      navigate('/driver-login');
    } catch (error: any) {
      toast.error(error.message || t('staffLogin.failedUpdatePassword'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Password Recovery Mode
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="absolute top-4 end-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md space-y-6">
          <Card className="border-2">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t('staffLogin.setNewPassword')}</CardTitle>
                <CardDescription>{t('staffLogin.enterNewPasswordBelow')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('staffLogin.newPassword')}</Label>
                  <div className="relative">
                    <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={t('staffLogin.enterNewPassword')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('staffLogin.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t('staffLogin.confirmNewPassword')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={isRTL ? 'pr-10' : 'pl-10'}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t('staffLogin.updating')}
                    </>
                  ) : (
                    t('staffLogin.updatePassword')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="absolute top-4 end-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md space-y-6">
          <button 
            onClick={() => {
              setShowForgotPassword(false);
              setResetRequestSent(false);
            }}
            className={`inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
            {t('staffLogin.backToLogin')}
          </button>

          <Card className="border-2">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {resetRequestSent ? (
                  <CheckCircle className="h-8 w-8 text-primary" />
                ) : (
                  <KeyRound className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {resetRequestSent ? t('staffLogin.requestSubmitted') : t('staffLogin.resetPassword')}
                </CardTitle>
                <CardDescription>
                  {resetRequestSent 
                    ? t('staffLogin.adminNotified')
                    : t('staffLogin.enterPhoneForReset')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {resetRequestSent ? (
                <div className="space-y-4">
                  <Alert className="bg-primary/10 border-primary/20">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      {t('staffLogin.adminWillContact')}
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetRequestSent(false);
                    }}
                    className="w-full"
                  >
                    <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
                    {t('staffLogin.backToLogin')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetPhone">{t('staffLogin.phoneNumber')}</Label>
                    <div className="relative">
                      <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                      <Input
                        id="resetPhone"
                        type="tel"
                        placeholder="+7 XXX XXX XX XX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        {t('staffLogin.submitting')}
                      </>
                    ) : (
                      t('staffLogin.requestPasswordReset')
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    {t('staffLogin.adminWillContact')}
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className={`inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
          {t('staffLogin.backToHome')}
        </Link>

        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('staffLogin.driverLogin')}</CardTitle>
              <CardDescription>
                {t('staffLogin.signInToAccess')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('staffLogin.phoneNumber')}</Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 XXX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Label htmlFor="password">{t('staffLogin.password')}</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('staffLogin.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('staffLogin.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t('staffLogin.signingIn')}
                  </>
                ) : (
                  t('staffLogin.signIn')
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t('staffLogin.contactAdmin')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverLogin;