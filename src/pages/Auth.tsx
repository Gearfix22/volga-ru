import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user, loading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Redirect authenticated users
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasMinLength = password.length >= 8;
    
    return hasUppercase && hasLowercase && hasNumbers && hasMinLength;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(loginEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }

    if (!validatePassword(loginPassword)) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      
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
    
    if (!validateEmail(signupEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }

    if (!validatePassword(signupPassword)) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
        variant: 'destructive'
      });
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive'
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Full name is required.',
        variant: 'destructive'
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: 'Error',
        description: 'Phone number is required.',
        variant: 'destructive'
      });
      return;
    }

    // Validate phone format (basic check)
    if (!/^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s\-()]/g, ''))) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number with country code.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(signupEmail, signupPassword, phone, fullName);
      
      if (error) {
        if (error.message === 'User already registered') {
          toast({
            title: 'Sign Up Failed',
            description: 'This email is already registered.',
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
        
        // Switch to login tab after successful signup
        setActiveTab('login');
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

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Welcome to Volga Services
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Sign in or create an account to continue
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-center">Authentication</CardTitle>
              <CardDescription className="text-center">
                Choose to sign in or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="focus:ring-2 focus:ring-primary pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 (999) 123-45-67"
                        required
                        className="focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        International format with country code (e.g., +7 999 123-45-67)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="focus:ring-2 focus:ring-primary pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must be 8+ characters with uppercase, lowercase, and numbers
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          required
                          className="focus:ring-2 focus:ring-primary pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-6 border-t space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your information is encrypted and secure.
                  </AlertDescription>
                </Alert>
                
                <Alert variant="default" className="border-primary/30 bg-primary/5">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    Admin accounts are created and managed separately by the system administrator.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;