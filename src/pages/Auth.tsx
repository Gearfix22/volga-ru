import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, Sparkles, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, signupSchema } from '@/lib/validationSchemas';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn, resetPassword, updatePassword, user, loading, session, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('customer');
  const [customerMode, setCustomerMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Check for password recovery mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'recovery' && session) {
      setIsRecoveryMode(true);
    }
  }, [session]);

  // Redirect authenticated users based on role (except in recovery mode)
  useEffect(() => {
    if (user && !loading && !isRecoveryMode) {
      if (hasRole('admin')) {
        navigate('/admin');
      } else if (hasRole('driver')) {
        navigate('/driver-dashboard');
      } else if (hasRole('guide')) {
        navigate('/guide-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    }
  }, [user, loading, navigate, isRecoveryMode, hasRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(validation.data.email, validation.data.password);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast({
            title: 'Login Failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive'
          });
        } else if (error.message === 'Email not confirmed') {
          toast({
            title: 'Email Not Confirmed',
            description: 'Please check your email for the confirmation link.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Login Failed',
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      confirmPassword: confirmPassword,
      fullName: fullName,
      phone: phone.replace(/[\s\-()]/g, ''),
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(
        validation.data.email, 
        validation.data.password, 
        validation.data.phone, 
        validation.data.fullName
      );
      
      if (error) {
        if (error.code === 'EMAIL_EXISTS' || error.message === 'User already registered' || error.message === 'Email already registered') {
          toast({
            title: 'Sign Up Failed',
            description: 'This email is already registered. Please use a different email or sign in.',
            variant: 'destructive'
          });
        } else if (error.code === 'PHONE_EXISTS' || error.message === 'Phone number already registered' || error.status === 409) {
          toast({
            title: 'Sign Up Failed',
            description: 'This phone number is already registered. Please use a different phone number or sign in.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Sign Up Failed',
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.',
        });
        setCustomerMode('login');
        setLoginEmail(signupEmail);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter email and password.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: {
          email: adminEmail,
          password: adminPassword
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        toast({
          title: 'Login Failed',
          description: data?.error || 'Invalid credentials or insufficient permissions.',
          variant: 'destructive'
        });
        return;
      }

      if (data?.session?.access_token && data?.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      toast({
        title: 'Login Successful',
        description: 'Welcome, Administrator!',
      });

      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error?.message || 'Invalid credentials.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your email address.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(forgotEmail);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: 'Email Sent',
          description: 'Check your email for a password reset link.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully updated.',
        });
        setIsRecoveryMode(false);
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Password Recovery Mode UI
  if (isRecoveryMode) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <AnimatedBackground />
        <Navigation />
        
        <div className="relative z-10 pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mb-4 shadow-lg">
                <Lock className="h-8 w-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Set New Password
              </h1>
              <p className="text-lg text-muted-foreground">
                Enter your new password below
              </p>
            </div>

            <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">Create New Password</CardTitle>
                <CardDescription className="text-center">
                  Your password must be at least 8 characters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4 text-primary" />
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password" className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4 text-primary" />
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-new-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        minLength={8}
                        className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Forgot Password UI
  if (showForgotPassword) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <AnimatedBackground />
        <Navigation />
        
        <div className="relative z-10 pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mb-4 shadow-lg">
                <Mail className="h-8 w-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Reset Password
              </h1>
              <p className="text-lg text-muted-foreground">
                {resetEmailSent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}
              </p>
            </div>

            <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-center">
                  {resetEmailSent ? 'Email Sent!' : 'Forgot Password'}
                </CardTitle>
                <CardDescription className="text-center">
                  {resetEmailSent 
                    ? 'We sent a password reset link to your email.'
                    : 'Enter your email address and we\'ll send you a link to reset your password.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resetEmailSent ? (
                  <div className="space-y-4">
                    <Alert className="bg-primary/5 border-primary/20">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">
                        If an account exists with that email, you'll receive a password reset link shortly.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      variant="outline"
                      className="w-full h-11" 
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                        setForgotEmail('');
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4 text-primary" />
                        Email Address
                      </Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-semibold" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>

                    <Button 
                      type="button"
                      variant="ghost"
                      className="w-full h-11" 
                      onClick={() => setShowForgotPassword(false)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground mb-4 shadow-lg">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome to Volga Services
            </h1>
            <p className="text-lg text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center">Account Access</CardTitle>
              <CardDescription className="text-center">
                Choose your account type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Only Customer tab - Admin/Driver/Guide use separate login pages */}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Customer Account</span>
                  </div>
                </div>
                
                {/* Customer Login/Signup */}
                <TabsContent value="customer" className="space-y-4 mt-0">
                  {/* Toggle between login and signup */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={customerMode === 'login' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setCustomerMode('login')}
                    >
                      Sign In
                    </Button>
                    <Button
                      type="button"
                      variant={customerMode === 'signup' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setCustomerMode('signup')}
                    >
                      Sign Up
                    </Button>
                  </div>

                  {customerMode === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="h-4 w-4 text-primary" />
                          Email Address
                        </Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="flex items-center gap-2 text-sm font-medium">
                            <Lock className="h-4 w-4 text-primary" />
                            Password
                          </Label>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-sm text-primary hover:text-primary/80"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-semibold" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing In...
                          </span>
                        ) : 'Sign In'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-4 w-4 text-primary" />
                          Full Name
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          maxLength={100}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="h-4 w-4 text-primary" />
                          Email Address
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="you@example.com"
                          maxLength={255}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="h-4 w-4 text-primary" />
                          Phone Number
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+7 999 123 45 67"
                          maxLength={20}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground">
                          Include country code (e.g., +7 for Russia)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="h-4 w-4 text-primary" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Create a strong password"
                            required
                            className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Min 8 characters with uppercase, lowercase & numbers
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="flex items-center gap-2 text-sm font-medium">
                          <Lock className="h-4 w-4 text-primary" />
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-semibold" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating Account...
                          </span>
                        ) : 'Create Account'}
                      </Button>
                    </form>
                  )}
                </TabsContent>
                
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
