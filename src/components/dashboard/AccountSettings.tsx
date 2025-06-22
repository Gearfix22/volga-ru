
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDataTracking } from '@/hooks/useDataTracking';
import { updateUserProfile } from '@/services/database';

export const AccountSettings: React.FC = () => {
  const { user, sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  const { trackForm } = useDataTracking();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneVerification, setPhoneVerification] = useState({
    step: 'idle', // 'idle', 'sending', 'verifying'
    otp: '',
  });
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    language: 'English',
    notifications: true,
  });

  // Initialize form data from user metadata
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        phone: user.phone || user.user_metadata?.phone || '',
        language: user.user_metadata?.language || 'English',
        notifications: user.user_metadata?.notifications !== false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      trackForm('account_settings', 'submitted', formData);
      await updateUserProfile(formData);
      
      toast({
        title: "Settings Updated",
        description: "Your account settings have been saved successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!formData.phone) {
      toast({
        title: "Error",
        description: "Please enter a phone number first",
        variant: "destructive",
      });
      return;
    }

    setPhoneVerification(prev => ({ ...prev, step: 'sending' }));
    
    try {
      const { error } = await sendOtp(formData.phone);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setPhoneVerification(prev => ({ ...prev, step: 'idle' }));
      } else {
        setPhoneVerification(prev => ({ ...prev, step: 'verifying' }));
        toast({
          title: "Verification Code Sent",
          description: "Please check your phone for the verification code",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
      setPhoneVerification(prev => ({ ...prev, step: 'idle' }));
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneVerification.otp) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await verifyOtp(formData.phone, phoneVerification.otp, 'phone_change');
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Phone Verified",
          description: "Your phone number has been verified successfully",
        });
        setPhoneVerification({ step: 'idle', otp: '' });
        // Refresh user data to show verified status
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify phone number",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    trackForm('account_settings', 'field_changed', { field, value }, field);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please sign in to view account settings.</p>
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
            <CardTitle>Profile Information</CardTitle>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed from here
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="space-y-2">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="+1 (555) 123-4567"
                />
                {isEditing && formData.phone && !user.phone_confirmed_at && (
                  <div className="space-y-2">
                    {phoneVerification.step === 'idle' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSendPhoneVerification}
                        className="w-full"
                      >
                        Verify Phone Number
                      </Button>
                    )}
                    {phoneVerification.step === 'sending' && (
                      <Button size="sm" disabled className="w-full">
                        Sending Code...
                      </Button>
                    )}
                    {phoneVerification.step === 'verifying' && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter verification code"
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
                )}
                {user.phone_confirmed_at && (
                  <p className="text-xs text-green-600">✓ Phone number verified</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="language">Preferred Language</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">
                  Receive booking confirmations and updates via email
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) => handleInputChange('notifications', e.target.checked)}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Account Created</Label>
                <p className="text-sm text-gray-600">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <Label>Last Sign In</Label>
                <p className="text-sm text-gray-600">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <Label>Email Verified</Label>
                <p className="text-sm text-gray-600">
                  {user.email_confirmed_at ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <Label>Phone Verified</Label>
                <p className="text-sm text-gray-600">
                  {user.phone_confirmed_at ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <Label>User ID</Label>
                <p className="text-sm text-gray-600 font-mono">
                  {user.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
