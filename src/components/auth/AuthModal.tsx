import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { PhoneInput } from '@/components/ui/phone-input';
import { cn } from '@/lib/utils';

/**
 * AuthModal Component
 * نموذج تسجيل الدخول / إنشاء حساب جديد
 * 
 * Features:
 * - Multi-language support (i18n)
 * - Multi-country phone input
 * - RTL support for Arabic
 * - Validation and error handling
 */

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sign-in' | 'sign-up' | 'forgot'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Phone input state
  const [phoneData, setPhoneData] = useState({
    phone: '',
    countryCode: 'EG',
    dialCode: '+20',
    phoneE164: '',
    isValid: false
  });
  
  const { signIn, signUp } = useAuth();
  const { t, isRTL } = useLanguage();

  const resetState = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhoneData({
      phone: '',
      countryCode: 'EG',
      dialCode: '+20',
      phoneE164: '',
      isValid: false
    });
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
        // Validate phone number
        if (!phoneData.phoneE164 || !phoneData.isValid) {
          toast({
            title: t('auth.error'),
            description: t('auth.invalidPhoneFormat'),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, phoneData.phoneE164, fullName, 'user');
        if (error) {
          if (error.code === 'EMAIL_EXISTS' || error.message === 'Email already registered') {
            toast({
              title: t('auth.signUpFailed'),
              description: t('auth.emailAlreadyRegistered'),
              variant: 'destructive',
            });
          } else if (error.code === 'PHONE_EXISTS' || error.message === 'Phone number already registered') {
            toast({
              title: t('auth.signUpFailed'),
              description: t('auth.phoneAlreadyRegistered'),
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('auth.signUpFailed'),
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: t('auth.accountCreated'),
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
    // MOBILE-SAFE: Use conditional redirect URL (works in WebView)
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin + '/dashboard/settings' : undefined;
    
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir={isRTL ? 'rtl' : 'ltr'}>
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
              {activeTab === 'sign-in' && t('auth.enterCredentials')}
              {activeTab === 'sign-up' && t('auth.enterDetails')}
              {activeTab === 'forgot' && t('auth.emailResetLink')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name - Sign Up Only */}
              {activeTab === 'sign-up' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className={cn(isRTL && 'text-right block')}>
                    {t('auth.fullName')}
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.enterFullName')}
                    required
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              )}
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className={cn(isRTL && 'text-right block')}>
                  {t('auth.emailAddress')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.enterEmailPlaceholder')}
                  required
                  dir="ltr"
                />
              </div>
              
              {/* Phone Number - Sign Up Only */}
              {activeTab === 'sign-up' && (
                <PhoneInput
                  label={t('auth.phoneNumber')}
                  value={phoneData.phone}
                  countryCode={phoneData.countryCode}
                  onChange={setPhoneData}
                  required
                  error={phoneData.phone && !phoneData.isValid ? t('auth.invalidPhoneFormat') : undefined}
                />
              )}
              
              {/* Password - Not for Forgot */}
              {activeTab !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className={cn(isRTL && 'text-right block')}>
                    {t('auth.password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.enterPassword')}
                    required
                    dir="ltr"
                  />
                  {activeTab === 'sign-up' && (
                    <p className="text-xs text-muted-foreground">
                      {t('auth.passwordRequirements')}
                    </p>
                  )}
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
                <Button 
                  variant="link" 
                  onClick={() => { setActiveTab('sign-up'); resetState(); }} 
                  className="text-sm"
                >
                  {t('auth.dontHaveAccount')}
                </Button>
              )}
              {activeTab === 'sign-up' && (
                <Button 
                  variant="link" 
                  onClick={() => { setActiveTab('sign-in'); resetState(); }} 
                  className="text-sm"
                >
                  {t('auth.alreadyHaveAccount')}
                </Button>
              )}
              {(activeTab === 'sign-in' || activeTab === 'sign-up') && (
                <Button 
                  variant="link" 
                  onClick={() => { setActiveTab('forgot'); resetState(); }} 
                  className="text-xs"
                >
                  {t('auth.forgotPasswordLink')}
                </Button>
              )}
              {activeTab === 'forgot' && (
                <Button 
                  variant="link" 
                  onClick={() => { setActiveTab('sign-in'); resetState(); }} 
                  className="text-xs"
                >
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