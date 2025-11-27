import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { UserActivityHistory } from '@/components/dashboard/UserActivityHistory';

const DashboardActivity: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all your activities and interactions on the platform
          </p>
        </div>

        <UserActivityHistory />
      </div>
    </DashboardLayout>
  );
};

export default DashboardActivity;