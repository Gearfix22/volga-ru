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
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, signupSchema } from '@/lib/validationSchemas';

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with zod schema
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
    
    // Validate with zod schema
    const validation = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      confirmPassword: confirmPassword,
      fullName: fullName,
      phone: phone.replace(/[\s\-()]/g, ''), // Remove formatting for validation
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
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
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
                Choose to sign in or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="text-sm font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-medium">Sign Up</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login" className="space-y-4 mt-0">
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
                      <Label htmlFor="login-password" className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="h-4 w-4 text-primary" />
                        Password
                      </Label>
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
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                {/* Signup Form */}
                <TabsContent value="signup" className="space-y-4 mt-0">
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
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Security Note */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <Alert className="bg-primary/5 border-primary/20">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm text-muted-foreground">
                    Your data is encrypted and secure. We never share your information.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
