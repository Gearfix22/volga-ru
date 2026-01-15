import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Shield, Lock, Mail, AlertTriangle, Globe, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';

const isAdminDomain = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'admin.volgaservices.com' ||
    hostname.startsWith('admin.') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    // Allow Lovable preview URLs
    hostname.includes('lovable.app') ||
    hostname.includes('lovableproject.com')
  );
};

const AdminLogin = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidDomain, setIsValidDomain] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { user, hasRole, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check domain validity
    setIsValidDomain(isAdminDomain());
    
    // Check for recovery mode from URL
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
          title: 'Login Failed',
          description: 'Invalid credentials. Please try again.',
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
          title: 'Welcome Admin',
          description: 'Login successful',
        });

        navigate('/admin');
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login',
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
        title: 'Email Required',
        description: 'Please enter your admin email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send reset email',
          variant: 'destructive',
        });
        return;
      }
      
      setResetEmailSent(true);
      toast({
        title: 'Reset Email Sent',
        description: 'Check your email for the password reset link. It expires in 24 hours.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
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
        title: 'Password Mismatch',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update password',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully reset',
      });
      
      setIsRecoveryMode(false);
      navigate('/admin-login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Block access on non-admin domains
  if (!isValidDomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Domain</CardTitle>
            <CardDescription>
              Admin login is only accessible at <strong>admin.volgaservices.com</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password Recovery Mode
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <AnimatedBackground />
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
                <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                <CardDescription className="mt-2">
                  Enter your new password below
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4 text-primary" />
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    className="h-11 bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4 text-primary" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    className="h-11 bg-background/50 border-border/50"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <AnimatedBackground />
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
                  {resetEmailSent ? 'Check Your Email' : 'Reset Password'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {resetEmailSent 
                    ? 'We sent a password reset link to your email. It expires in 24 hours.'
                    : 'Enter your admin email to receive a reset link'}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {resetEmailSent ? (
                <div className="space-y-4">
                  <Alert className="bg-primary/10 border-primary/20">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      Click the link in your email to reset your password. Then return here to log in.
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-primary" />
                      Admin Email
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
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatedBackground />
      
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
              <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
              <CardDescription className="mt-2">
                Secure access for administrators only
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-primary" />
                  Admin Email
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4 text-primary" />
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    autoComplete="current-password"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In as Admin'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This page is restricted. Unauthorized access attempts are logged.
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
