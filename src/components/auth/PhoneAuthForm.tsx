
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PhoneAuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onSwitchMode?: () => void;
}

export const PhoneAuthForm: React.FC<PhoneAuthFormProps> = ({ 
  mode, 
  onSuccess, 
  onSwitchMode 
}) => {
  const { signUpWithPhone, signInWithPhone, verifyOtp } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    otp: '',
  });

  const formatPhoneNumber = (phone: string) => {
    // Add country code if not present
    if (!phone.startsWith('+')) {
      return `+1${phone.replace(/\D/g, '')}`;
    }
    return phone;
  };

  const handlePhoneAuth = async () => {
    if (!formData.phone || !formData.password) {
      toast({
        title: t('common.error'),
        description: t('auth.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhoneNumber(formData.phone);

    try {
      let result;
      if (mode === 'signup') {
        result = await signUpWithPhone(formattedPhone, formData.password);
      } else {
        result = await signInWithPhone(formattedPhone, formData.password);
      }

      if (result.error) {
        if (result.error.message.includes('Signup requires email verification')) {
          setStep('verify');
          toast({
            title: t('auth.verificationRequired'),
            description: t('auth.enterVerificationCode'),
          });
        } else {
          toast({
            title: t('common.error'),
            description: result.error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t('common.success'),
          description: mode === 'signup' ? t('auth.accountCreated') : t('auth.signedInSuccess'),
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp) {
      toast({
        title: t('common.error'),
        description: t('auth.enterVerificationCode'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhoneNumber(formData.phone);

    try {
      const { error } = await verifyOtp(formattedPhone, formData.otp, 'sms');
      
      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('auth.phoneVerified'),
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('auth.verifyPhoneNumber')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="otp">{t('auth.verificationCode')}</Label>
            <Input
              id="otp"
              type="text"
              value={formData.otp}
              onChange={(e) => handleInputChange('otp', e.target.value)}
              placeholder={t('auth.enterSixDigitCode')}
              maxLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full"
            >
              {loading ? t('auth.verifying') : t('auth.verifyCode')}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setStep('phone')}
              className="w-full"
            >
              {t('auth.backToPhoneEntry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'signup' ? t('auth.signUpWithPhone') : t('auth.signInWithPhone')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="phone">{t('booking.phoneNumber')}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder={t('auth.enterPassword')}
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handlePhoneAuth}
            disabled={loading}
            className="w-full"
          >
            {loading ? t('auth.processing') : (mode === 'signup' ? t('auth.signUp') : t('auth.signIn'))}
          </Button>
          
          {onSwitchMode && (
            <Button 
              variant="outline"
              onClick={onSwitchMode}
              className="w-full"
            >
              {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
