import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t, isRTL } = useLanguage();
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
        title: t('accountSettings.profileUpdated'),
        description: t('accountSettings.profileSavedSuccess'),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('common.error'),
        description: t('accountSettings.failedToUpdate'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!formData.phone) {
      toast({
        title: t('common.error'),
        description: t('accountSettings.enterPhoneFirst'),
        variant: 'destructive',
      });
      return;
    }

    setPhoneVerification(prev => ({ ...prev, step: 'sending' }));
    
    try {
      const { error } = await sendOtp(formData.phone);
      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
        setPhoneVerification(prev => ({ ...prev, step: 'idle' }));
      } else {
        setPhoneVerification(prev => ({ ...prev, step: 'verifying' }));
        toast({
          title: t('accountSettings.codeSent'),
          description: t('accountSettings.checkPhoneForCode'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('accountSettings.failedToSendCode'),
        variant: 'destructive',
      });
      setPhoneVerification(prev => ({ ...prev, step: 'idle' }));
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneVerification.otp) {
      toast({
        title: t('common.error'),
        description: t('accountSettings.enterVerificationCode'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await verifyOtp(formData.phone, phoneVerification.otp, 'phone_change');
      if (error) {
        toast({
          title: t('common.error'),
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
          title: t('accountSettings.phoneVerified'),
          description: t('accountSettings.phoneVerifiedSuccess'),
        });
        setPhoneVerification({ step: 'idle', otp: '' });
        setFormData(prev => ({ ...prev, phone_verified: true }));
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('accountSettings.failedToVerify'),
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className={`text-center text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
            {t('accountSettings.signInToViewSettings')}
          </p>
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
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="h-5 w-5" />
                {t('accountSettings.profileInformation')}
              </CardTitle>
              <CardDescription>{t('accountSettings.managePersonalDetails')}</CardDescription>
            </div>
            <Button
              variant={isEditing ? 'outline' : 'default'}
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              {isEditing ? t('accountSettings.cancel') : (
                <>
                  <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('accountSettings.edit')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('accountSettings.fullName')}</Label>
              <Input
                id="fullName"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                disabled={!isEditing || loading}
                placeholder={t('accountSettings.enterFullName')}
                className={isRTL ? 'text-right' : ''}
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('accountSettings.emailAddress')}</Label>
              <div className="relative">
                <Mail className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className={`${isRTL ? 'pr-10 text-right' : 'pl-10'} bg-muted`}
                />
              </div>
              <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                {t('accountSettings.emailCannotBeChanged')}
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t('accountSettings.phoneNumber')}</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Phone className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value, phone_verified: false }))}
                    disabled={!isEditing || loading}
                    placeholder="+7 999 123 4567"
                    className={isRTL ? 'pr-10 text-right' : 'pl-10'}
                  />
                </div>
                
                {/* Phone verification status */}
                {formData.phone && (
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {formData.phone_verified ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t('accountSettings.verified')}
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="secondary">
                          <XCircle className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t('accountSettings.notVerified')}
                        </Badge>
                        {isEditing && phoneVerification.step === 'idle' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSendPhoneVerification}
                          >
                            {t('accountSettings.verifyNow')}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* OTP Input */}
                {phoneVerification.step === 'sending' && (
                  <Button size="sm" disabled className="w-full">
                    {t('accountSettings.sendingCode')}
                  </Button>
                )}
                {phoneVerification.step === 'verifying' && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <Label>{t('accountSettings.enterVerificationCode')}</Label>
                    <Input
                      placeholder={t('accountSettings.enterSixDigitCode')}
                      value={phoneVerification.otp}
                      onChange={(e) => setPhoneVerification(prev => ({ ...prev, otp: e.target.value }))}
                      maxLength={6}
                      className={isRTL ? 'text-right' : ''}
                    />
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button size="sm" onClick={handleVerifyPhone} className="flex-1">
                        {t('accountSettings.verify')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setPhoneVerification({ step: 'idle', otp: '' })}
                        className="flex-1"
                      >
                        {t('accountSettings.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">{t('accountSettings.preferredLanguage')}</Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_language: value }))}
                disabled={!isEditing || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('common.english')}</SelectItem>
                  <SelectItem value="ru">{t('common.russian')}</SelectItem>
                  <SelectItem value="ar">{t('common.arabic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEditing && (
            <div className={`flex justify-end pt-4 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button onClick={handleSave} disabled={loading}>
                <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {loading ? t('accountSettings.saving') : t('accountSettings.saveChanges')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Shield className="h-5 w-5" />
            {t('accountSettings.accountInformation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-muted-foreground">{t('accountSettings.accountCreated')}</Label>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : t('common.unknown')}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">{t('accountSettings.lastSignIn')}</Label>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : t('common.unknown')}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">{t('accountSettings.emailVerified')}</Label>
              <div>
                {user.email_confirmed_at ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('accountSettings.yes')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('accountSettings.no')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">{t('accountSettings.userId')}</Label>
              <p className={`text-sm font-mono text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};