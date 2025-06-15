import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sign-in' | 'sign-up' | 'forgot'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const resetState = () => {
    setEmail('');
    setPassword('');
    setPhone('');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'sign-in') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Logged in successfully!',
          });
          onClose();
        }
      } else if (activeTab === 'sign-up') {
        if (!phone.trim()) {
          toast({
            title: 'Error',
            description: 'Phone number is required.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, phone);
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Please check your email to verify your account.',
          });
          onClose();
        }
      } else if (activeTab === 'forgot') {
        const { error } = await requestPasswordReset(email);
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Password reset email sent. Please check your inbox.',
          });
          onClose();
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      resetState();
    }
  };

  // New: function to handle password reset request
  const requestPasswordReset = async (email: string) => {
    // Supabase password reset: send an email to user
    const { error } = await import('@/lib/supabase').then(({ supabase }) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/dashboard/settings',
      })
    );
    return { error };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'sign-in' && 'Sign In'}
            {activeTab === 'sign-up' && 'Sign Up'}
            {activeTab === 'forgot' && 'Forgot Password'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'sign-in' && 'Welcome back! Please sign in to your account.'}
            {activeTab === 'sign-up' && 'Create a new account to get started.'}
            {activeTab === 'forgot' && 'Enter your email and we’ll send you a reset link.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-1 text-sm justify-center">
          <Button
            type="button"
            variant={activeTab === 'sign-in' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => {
              setActiveTab('sign-in');
              resetState();
            }}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={activeTab === 'sign-up' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => {
              setActiveTab('sign-up');
              resetState();
            }}
          >
            Sign Up
          </Button>
          <Button
            type="button"
            variant={activeTab === 'forgot' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => {
              setActiveTab('forgot');
              resetState();
            }}
          >
            Forgot?
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {activeTab === 'sign-in' && 'Sign In'}
              {activeTab === 'sign-up' && 'Create Account'}
              {activeTab === 'forgot' && 'Reset Your Password'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'sign-in'
                ? 'Enter your credentials to access your account'
                : activeTab === 'sign-up'
                ? 'Enter your details to create a new account'
                : 'We will email you a password reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {activeTab === 'sign-up' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              )}
              {activeTab !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? 'Loading...'
                  : (activeTab === 'sign-in'
                    ? 'Sign In'
                    : activeTab === 'sign-up'
                    ? 'Sign Up'
                    : 'Send Reset Email')}
              </Button>
            </form>
            <div className="mt-4 text-center">
              {activeTab === 'sign-in' && (
                <Button variant="link" onClick={() => { setActiveTab('sign-up'); resetState(); }} className="text-sm">
                  Don't have an account? Sign up
                </Button>
              )}
              {activeTab === 'sign-up' && (
                <Button variant="link" onClick={() => { setActiveTab('sign-in'); resetState(); }} className="text-sm">
                  Already have an account? Sign in
                </Button>
              )}
              {(activeTab === 'sign-in' || activeTab === 'sign-up') && (
                <Button variant="link" onClick={() => { setActiveTab('forgot'); resetState(); }} className="text-xs">
                  Forgot password?
                </Button>
              )}
              {activeTab === 'forgot' && (
                <Button variant="link" onClick={() => { setActiveTab('sign-in'); resetState(); }} className="text-xs">
                  Back to sign in
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
