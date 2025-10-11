import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();

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
            title: t('auth.error'),
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('auth.success'),
            description: t('auth.loggedInSuccessfully'),
          });
          onClose();
        }
      } else if (activeTab === 'sign-up') {
        if (!phone.trim()) {
          toast({
            title: t('auth.error'),
            description: t('auth.phoneNumberRequired'),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, phone, '', 'user');
        if (error) {
          toast({
            title: t('auth.error'),
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('auth.success'),
            description: t('auth.checkEmailVerify'),
          });
          onClose();
        }
      } else if (activeTab === 'forgot') {
        const { error } = await requestPasswordReset(email);
        if (error) {
          toast({
            title: t('auth.error'),
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('auth.success'),
            description: t('auth.passwordResetSent'),
          });
          onClose();
        }
      }
    } catch (error) {
      toast({
        title: t('auth.error'),
        description: t('auth.unexpectedError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      resetState();
    }
  };

  const requestPasswordReset = async (email: string) => {
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
            {activeTab === 'sign-in' && t('auth.signIn')}
            {activeTab === 'sign-up' && t('auth.signUp')}
            {activeTab === 'forgot' && t('auth.forgotPassword')}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'sign-in' && t('auth.signInWelcome')}
            {activeTab === 'sign-up' && t('auth.signUpWelcome')}
            {activeTab === 'forgot' && t('auth.forgotPasswordWelcome')}
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
            {t('auth.signIn')}
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
            {t('auth.signUp')}
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
            {t('auth.forgotPassword')}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {activeTab === 'sign-in' && t('auth.signIn')}
              {activeTab === 'sign-up' && t('auth.createAccount')}
              {activeTab === 'forgot' && t('auth.resetYourPassword')}
            </CardTitle>
            <CardDescription>
              {activeTab === 'sign-in'
                ? t('auth.enterCredentials')
                : activeTab === 'sign-up'
                ? t('auth.enterDetails')
                : t('auth.emailResetLink')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('footer.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.enterEmailPlaceholder')}
                  required
                />
              </div>
              {activeTab === 'sign-up' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('booking.phoneNumber')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('auth.enterPhoneNumber')}
                    required
                  />
                </div>
              )}
              {activeTab !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.enterPassword')}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? t('auth.loading')
                  : (activeTab === 'sign-in'
                    ? t('auth.signIn')
                    : activeTab === 'sign-up'
                    ? t('auth.signUp')
                    : t('auth.sendResetEmail'))}
              </Button>
            </form>
            <div className="mt-4 text-center">
              {activeTab === 'sign-in' && (
                <Button variant="link" onClick={() => { setActiveTab('sign-up'); resetState(); }} className="text-sm">
                  {t('auth.dontHaveAccount')}
                </Button>
              )}
              {activeTab === 'sign-up' && (
                <Button variant="link" onClick={() => { setActiveTab('sign-in'); resetState(); }} className="text-sm">
                  {t('auth.alreadyHaveAccount')}
                </Button>
              )}
              {(activeTab === 'sign-in' || activeTab === 'sign-up') && (
                <Button variant="link" onClick={() => { setActiveTab('forgot'); resetState(); }} className="text-xs">
                  {t('auth.forgotPasswordLink')}
                </Button>
              )}
              {activeTab === 'forgot' && (
                <Button variant="link" onClick={() => { setActiveTab('sign-in'); resetState(); }} className="text-xs">
                  {t('auth.backToSignIn')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};