import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { UserActivityHistory } from '@/components/dashboard/UserActivityHistory';
import { useLanguage } from '@/contexts/LanguageContext';

const DashboardActivity: React.FC = () => {
  const { t } = useLanguage();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.activityHistory')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('dashboard.activityHistoryDescription')}
          </p>
        </div>

        <UserActivityHistory />
      </div>
    </DashboardLayout>
  );
};

export default DashboardActivity;