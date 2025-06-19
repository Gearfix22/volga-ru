
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';
import type { UserInfo } from '@/types/booking';

interface ContactInformationFormProps {
  userInfo: UserInfo;
  onUpdateUserInfo: (key: keyof UserInfo, value: string) => void;
}

export const ContactInformationForm: React.FC<ContactInformationFormProps> = ({
  userInfo,
  onUpdateUserInfo
}) => {
  const { t } = useLanguage();

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('contactInformation')}
        </CardTitle>
        <CardDescription>{t('contactInfoDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('fullName')} *
            </Label>
            <Input
              id="fullName"
              value={userInfo.fullName}
              onChange={(e) => onUpdateUserInfo('fullName', e.target.value)}
              placeholder={t('enterFullName')}
              className="focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('emailAddress')} *
            </Label>
            <Input
              id="email"
              type="email"
              value={userInfo.email}
              onChange={(e) => onUpdateUserInfo('email', e.target.value)}
              placeholder={t('enterEmail')}
              className="focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('phoneNumber')} *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={userInfo.phone}
              onChange={(e) => onUpdateUserInfo('phone', e.target.value)}
              placeholder={t('enterPhone')}
              className="focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('preferredLanguage')}
            </Label>
            <Select value={userInfo.language} onValueChange={(value) => onUpdateUserInfo('language', value)}>
              <SelectTrigger className="focus:ring-2 focus:ring-primary">
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">{t('english')}</SelectItem>
                <SelectItem value="arabic">{t('arabic')}</SelectItem>
                <SelectItem value="russian">{t('russian')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
