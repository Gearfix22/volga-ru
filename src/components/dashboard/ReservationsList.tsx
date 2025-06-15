
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
import { Calendar, MapPin, Users, CreditCard, Eye, Crown } from 'lucide-react';

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
      <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-600 font-semibold">Error loading reservations</p>
            <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatServiceDetails = (serviceType: string, details: any) => {
    switch (serviceType) {
      case 'Transportation':
        return `${details?.pickup || 'Pickup'} → ${details?.dropoff || 'Destination'}`;
      case 'Hotels':
        return `${details?.city || 'City'} - ${details?.hotel || 'Hotel'}`;
      case 'Events':
        return `${details?.eventName || 'Event'} at ${details?.eventLocation || 'Location'}`;
      case 'Custom Trips':
        return `${details?.duration || 'Duration'} in ${details?.regions || 'Russia'}`;
      default:
        return 'Luxury Russian Experience';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-volga-pearl border-russian-silver/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-russian-blue to-volga-logo-blue text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Crown className="h-6 w-6 text-russian-gold" />
          <CardTitle className="text-xl font-serif">Your Luxury Journeys</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-russian-blue to-volga-logo-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-gray-800 mb-2">No adventures yet</h3>
            <p className="text-gray-600 mb-6">Your journey through Russia awaits</p>
            <Button className="bg-gradient-to-r from-russian-blue to-volga-logo-blue text-white font-semibold px-8">
              Plan Your First Journey
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-volga-pearl to-russian-cream border-b border-russian-silver/20">
                  <TableHead className="font-semibold text-gray-700">Experience</TableHead>
                  <TableHead className="font-semibold text-gray-700">Journey Details</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date Booked</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Investment</TableHead>
                  <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-white/50 transition-colors duration-200 border-b border-russian-silver/10">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-russian-blue to-volga-logo-blue rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="font-serif font-semibold text-gray-800">{booking.service_type}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 font-medium">
                        {formatServiceDetails(booking.service_type, booking.service_details)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-700">
                        {new Date(booking.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(booking.booking_status)} font-medium border`}>
                        {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-lg text-russian-blue">${booking.total_price}</div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-russian-blue text-russian-blue hover:bg-russian-blue hover:text-white transition-all duration-200"
                      >
                        <Eye className="h-4 w-4 mr-2" />
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
