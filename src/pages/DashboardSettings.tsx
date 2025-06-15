
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AccountSettings } from '@/components/dashboard/AccountSettings';

const DashboardSettings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account preferences and security settings
          </p>
        </div>

        <AccountSettings />
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;
