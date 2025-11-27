
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserBookings } from '@/services/database';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ReservationsList } from '@/components/dashboard/ReservationsList';

const DashboardReservations: React.FC = () => {
  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['user-bookings'],
    queryFn: getUserBookings,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and view all your bookings
          </p>
        </div>

        <ReservationsList 
          bookings={bookings || []} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardReservations;
