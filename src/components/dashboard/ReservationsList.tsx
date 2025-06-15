
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar, MapPin, Users, CreditCard } from 'lucide-react';

interface Booking {
  id: string;
  service_type: string;
  booking_status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  service_details: any;
}

interface ReservationsListProps {
  bookings: Booking[];
  isLoading: boolean;
  error: any;
}

export const ReservationsList: React.FC<ReservationsListProps> = ({
  bookings,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading reservations</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatServiceDetails = (serviceType: string, details: any) => {
    switch (serviceType) {
      case 'Transportation':
        return `${details.pickup} → ${details.dropoff}`;
      case 'Hotels':
        return `${details.city} - ${details.hotel}`;
      case 'Events':
        return `${details.eventName} at ${details.eventLocation}`;
      case 'Custom Trips':
        return `${details.duration} in ${details.regions}`;
      default:
        return 'Service details';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservation History</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reservations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.service_type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatServiceDetails(booking.service_type, booking.service_details)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.booking_status)}>
                        {booking.booking_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${booking.total_price}</div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
