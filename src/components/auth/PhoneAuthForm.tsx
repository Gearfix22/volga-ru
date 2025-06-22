
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
        title: "Error",
        description: "Please fill in all fields",
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
            title: "Verification Required",
            description: "Please enter the verification code sent to your phone",
          });
        } else {
          toast({
            title: "Error",
            description: result.error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: mode === 'signup' ? "Account created successfully!" : "Signed in successfully!",
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
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
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Phone number verified successfully!",
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
          <CardTitle>Verify Phone Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              value={formData.otp}
              onChange={(e) => handleInputChange('otp', e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setStep('phone')}
              className="w-full"
            >
              Back to Phone Entry
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
          {mode === 'signup' ? 'Sign Up with Phone' : 'Sign In with Phone'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handlePhoneAuth}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : (mode === 'signup' ? 'Sign Up' : 'Sign In')}
          </Button>
          
          {onSwitchMode && (
            <Button 
              variant="outline"
              onClick={onSwitchMode}
              className="w-full"
            >
              {mode === 'signup' ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
