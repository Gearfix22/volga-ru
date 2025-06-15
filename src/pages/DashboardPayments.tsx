
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PaymentMethods } from '@/components/dashboard/PaymentMethods';

const DashboardPayments: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your saved payment methods and billing information
          </p>
        </div>

        <PaymentMethods />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPayments;
