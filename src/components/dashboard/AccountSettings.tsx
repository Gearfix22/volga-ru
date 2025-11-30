import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Mail, Shield, Calendar, CheckCircle, XCircle, Save, Edit } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProfileData {
  full_name: string;
  phone: string;
  preferred_language: string;
  phone_verified: boolean;
}

export const AccountSettings: React.FC = () => {
  const { user, sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [phoneVerification, setPhoneVerification] = useState({
    step: 'idle' as 'idle' | 'sending' | 'verifying',
    otp: '',
  });
  const [formData, setFormData] = useState<ProfileData>({
    full_name: '',
    phone: '',
    preferred_language: 'en',
    phone_verified: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          preferred_language: data.preferred_language || 'en',
          phone_verified: data.phone_verified || false,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          preferred_language: formData.preferred_language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!formData.phone) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number first',
        variant: 'destructive',
      });
      return;
    }

    setPhoneVerification(prev => ({ ...prev, step: 'sending' }));
    
    try {
      const { error } = await sendOtp(formData.phone);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        setPhoneVerification(prev => ({ ...prev, step: 'idle' }));
      } else {
        setPhoneVerification(prev => ({ ...prev, step: 'verifying' }));
        toast({
          title: 'Code Sent',
          description: 'Please check your phone for the verification code',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send verification code',
        variant: 'destructive',
      });
      setPhoneVerification(prev => ({ ...prev, step: 'idle' }));
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneVerification.otp) {
      toast({
        title: 'Error',
        description: 'Please enter the verification code',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await verifyOtp(formData.phone, phoneVerification.otp, 'phone_change');
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Update profile to mark phone as verified
        await supabase
          .from('profiles')
          .update({ phone_verified: true })
          .eq('id', user?.id);

        toast({
          title: 'Phone Verified',
          description: 'Your phone number has been verified successfully',
        });
        setPhoneVerification({ step: 'idle', otp: '' });
        setFormData(prev => ({ ...prev, phone_verified: true }));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify phone number',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please sign in to view account settings.</p>
        </CardContent>
      </Card>
    );
  }

  if (loadingProfile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Manage your personal details</CardDescription>
            </div>
            <Button
              variant={isEditing ? 'outline' : 'default'}
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              {isEditing ? 'Cancel' : <><Edit className="h-4 w-4 mr-2" />Edit</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                disabled={!isEditing || loading}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value, phone_verified: false }))}
                    disabled={!isEditing || loading}
                    placeholder="+7 999 123 4567"
                    className="pl-10"
                  />
                </div>
                
                {/* Phone verification status */}
                {formData.phone && (
                  <div className="flex items-center gap-2">
                    {formData.phone_verified ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Verified
                        </Badge>
                        {isEditing && phoneVerification.step === 'idle' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSendPhoneVerification}
                          >
                            Verify Now
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* OTP Input */}
                {phoneVerification.step === 'sending' && (
                  <Button size="sm" disabled className="w-full">
                    Sending Code...
                  </Button>
                )}
                {phoneVerification.step === 'verifying' && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <Label>Enter Verification Code</Label>
                    <Input
                      placeholder="Enter 6-digit code"
                      value={phoneVerification.otp}
                      onChange={(e) => setPhoneVerification(prev => ({ ...prev, otp: e.target.value }))}
                      maxLength={6}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleVerifyPhone} className="flex-1">
                        Verify
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setPhoneVerification({ step: 'idle', otp: '' })}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_language: value }))}
                disabled={!isEditing || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Account Created</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Last Sign In</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Email Verified</Label>
              <div>
                {user.email_confirmed_at ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">User ID</Label>
              <p className="text-sm font-mono text-muted-foreground">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
