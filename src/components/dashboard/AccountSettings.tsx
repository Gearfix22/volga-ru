
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDataTracking } from '@/hooks/useDataTracking';
import { updateUserProfile } from '@/services/database';
import { Settings, User, Mail, Phone, Globe, Bell, Shield, Crown } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackForm } = useDataTracking();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
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
        phone: user.user_metadata?.phone || '',
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    trackForm('account_settings', 'field_changed', { field, value }, field);
  };

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Please sign in to view account settings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-russian-blue to-volga-logo-blue text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-6 w-6 text-russian-gold" />
              <CardTitle className="text-xl font-serif">Profile Information</CardTitle>
            </div>
            <Button
              variant={isEditing ? "outline" : "secondary"}
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
              className={isEditing ? "border-white text-white hover:bg-white hover:text-russian-blue" : "bg-russian-gold text-russian-blue hover:bg-yellow-400 font-semibold"}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="displayName" className="flex items-center space-x-2 text-gray-700 font-medium">
                <User className="h-4 w-4" />
                <span>Display Name</span>
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                disabled={!isEditing || loading}
                className="mt-2 border-russian-silver/30 focus:border-russian-blue"
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center space-x-2 text-gray-700 font-medium">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="mt-2 bg-gray-50 border-russian-silver/30"
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Email cannot be changed from here
              </p>
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center space-x-2 text-gray-700 font-medium">
                <Phone className="h-4 w-4" />
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing || loading}
                placeholder="+1 (555) 123-4567"
                className="mt-2 border-russian-silver/30 focus:border-russian-blue"
              />
            </div>
            <div>
              <Label htmlFor="language" className="flex items-center space-x-2 text-gray-700 font-medium">
                <Globe className="h-4 w-4" />
                <span>Preferred Language</span>
              </Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full mt-2 px-3 py-2 border border-russian-silver/30 rounded-md focus:outline-none focus:ring-2 focus:ring-russian-blue focus:border-russian-blue disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="English">English</option>
                <option value="Russian">Русский</option>
                <option value="Spanish">Español</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-russian-silver/20">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="border-russian-blue text-russian-blue hover:bg-russian-blue hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-russian-blue to-volga-logo-blue text-white hover:from-volga-logo-blue hover:to-russian-blue font-semibold"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-russian-blue" />
            <CardTitle className="text-xl font-serif text-gray-800">Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-russian-silver/20">
              <div>
                <Label className="text-base font-medium text-gray-800">Email Notifications</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive booking confirmations and exclusive travel updates
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) => handleInputChange('notifications', e.target.checked)}
                disabled={loading}
                className="h-5 w-5 text-russian-blue focus:ring-russian-blue border-gray-300 rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-russian-blue" />
            <CardTitle className="text-xl font-serif text-gray-800">Account Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/50 rounded-xl border border-russian-silver/20">
              <Label className="text-sm font-medium text-gray-700">Account Created</Label>
              <p className="text-base text-gray-900 font-medium mt-1">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown'}
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl border border-russian-silver/20">
              <Label className="text-sm font-medium text-gray-700">Last Sign In</Label>
              <p className="text-base text-gray-900 font-medium mt-1">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown'}
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl border border-russian-silver/20">
              <Label className="text-sm font-medium text-gray-700">Email Verified</Label>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${user.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <p className="text-base text-gray-900 font-medium">
                  {user.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-white/50 rounded-xl border border-russian-silver/20">
              <Label className="text-sm font-medium text-gray-700">User ID</Label>
              <p className="text-xs text-gray-600 font-mono mt-1 break-all">
                {user.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
