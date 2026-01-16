import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Shield, Lock, Mail, ArrowLeft, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/**
 * MOBILE-FIRST: Admin access is role-based, not domain-based
 * This always returns true; actual auth is handled by edge functions
 */
const isAdminAccessAllowed = (): boolean => {
  return true; // Role-based auth handles actual access control
};

const AdminLogin = () => {
  const { t, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { user, hasRole, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    }
    
    // Redirect if already logged in as admin
    if (user && hasRole('admin')) {
      navigate('/admin');
    }
  }, [user, navigate, hasRole, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the admin-login edge function
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { email, password }
      });

      if (error) {
        toast({
          title: t('staffLogin.loginFailed'),
          description: t('staffLogin.invalidCredentials'),
          variant: 'destructive',
        });
        return;
      }

      if (data?.success && data?.session) {
        // Set the session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        toast({
          title: t('staffLogin.welcomeAdmin'),
          description: t('staffLogin.loginSuccess'),
        });

        navigate('/admin');
      } else {
        toast({
          title: t('staffLogin.loginFailed'),
          description: t('staffLogin.invalidCredentials'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('staffLogin.errorOccurred'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: t('staffLogin.emailRequired'),
        description: t('staffLogin.enterAdminEmail'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: t('error'),
          description: error.message || t('staffLogin.resetEmailFailed'),
          variant: 'destructive',
        });
        return;
      }
      
      setResetEmailSent(true);
      toast({
        title: t('staffLogin.resetEmailSent'),
        description: t('staffLogin.checkEmailForReset'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('staffLogin.resetEmailFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t('staffLogin.passwordMismatch'),
        description: t('staffLogin.passwordsDoNotMatch'),
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: t('staffLogin.weakPassword'),
        description: t('staffLogin.passwordMinLength'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast({
          title: t('error'),
          description: error.message || t('staffLogin.updatePasswordFailed'),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t('staffLogin.passwordUpdated'),
        description: t('staffLogin.passwordResetSuccess'),
      });
      
      setIsRecoveryMode(false);
      navigate('/admin-login');
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('staffLogin.updatePasswordFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Password Recovery Mode
  if (isRecoveryMode) {
    return (
      <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isRTL ? 'rtl' : ''}`}>
        <AnimatedBackground />
        <div className="absolute top-4 right-4 z-20">
          <LanguageSwitcher />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-xl">
            <CardHeader className="space-y-4 text-center pb-2">
              <div className="flex justify-center mb-2">
                <Logo />
              </div>
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                  <KeyRound className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">{t('staffLogin.setNewPassword')}</CardTitle>
                <CardDescription className="mt-2">
                  {t('staffLogin.enterNewPasswordBelow')}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className={`flex items-center gap-2 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Lock className="h-4 w-4 text-primary" />
                    {t('staffLogin.newPassword')}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('staffLogin.enterNewPassword')}
                    required
                    minLength={8}
                    className="h-11 bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={`flex items-center gap-2 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Lock className="h-4 w-4 text-primary" />
                    {t('staffLogin.confirmPassword')}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('staffLogin.confirmNewPassword')}
                    required
                    minLength={8}
                    className="h-11 bg-background/50 border-border/50"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? t('staffLogin.updating') : t('staffLogin.updatePassword')}
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
      <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isRTL ? 'rtl' : ''}`}>
        <AnimatedBackground />
        <div className="absolute top-4 right-4 z-20">
          <LanguageSwitcher />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-xl">
            <CardHeader className="space-y-4 text-center pb-2">
              <div className="flex justify-center mb-2">
                <Logo />
              </div>
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                  {resetEmailSent ? (
                    <CheckCircle className="h-10 w-10 text-primary-foreground" />
                  ) : (
                    <KeyRound className="h-10 w-10 text-primary-foreground" />
                  )}
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {resetEmailSent ? t('staffLogin.checkYourEmail') : t('staffLogin.resetPassword')}
                </CardTitle>
                <CardDescription className="mt-2">
                  {resetEmailSent 
                    ? t('staffLogin.resetLinkSent')
                    : t('staffLogin.enterEmailForReset')}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {resetEmailSent ? (
                <div className="space-y-4">
                  <Alert className="bg-primary/10 border-primary/20">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      {t('staffLogin.clickResetLink')}
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                    className={`w-full ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('staffLogin.backToLogin')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className={`flex items-center gap-2 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Mail className="h-4 w-4 text-primary" />
                      {t('staffLogin.adminEmail')}
                    </Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                      className="h-11 bg-background/50 border-border/50"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? t('staffLogin.sending') : t('staffLogin.sendResetLink')}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForgotPassword(false)}
                    className={`w-full ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('staffLogin.backToLogin')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isRTL ? 'rtl' : ''}`}>
      <AnimatedBackground />
      
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="flex justify-center mb-2">
              <Logo />
            </div>
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                <Shield className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{t('staffLogin.adminPortal')}</CardTitle>
              <CardDescription className="mt-2">
                {t('staffLogin.secureAccessAdmins')}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={`flex items-center gap-2 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Mail className="h-4 w-4 text-primary" />
                  {t('staffLogin.adminEmail')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Label htmlFor="password" className={`flex items-center gap-2 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Lock className="h-4 w-4 text-primary" />
                    {t('staffLogin.password')}
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('staffLogin.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('staffLogin.enterAdminPassword')}
                    required
                    autoComplete="current-password"
                    className={`h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary ${isRTL ? 'pl-10' : 'pr-10'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={`h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                    {t('staffLogin.signingIn')}
                  </>
                ) : (
                  t('staffLogin.signInAsAdmin')
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {t('staffLogin.restrictedPage')}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;