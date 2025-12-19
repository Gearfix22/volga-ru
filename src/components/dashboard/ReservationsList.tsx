import React, { useState } from 'react';
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
import { Calendar, ChevronDown, ChevronUp, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { DriverInfoCard } from '@/components/booking/DriverInfoCard';
import { BookingStatusTimeline } from '@/components/booking/BookingStatusTimeline';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  total_price: number;
  created_at: string;
  service_details: any;
  payment_method?: string;
  assigned_driver_id?: string | null;
  driver_response?: string;
  show_driver_to_customer?: boolean;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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
          <p className="text-destructive">Error loading reservations</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'on_trip':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_trip':
        return 'Driver On Trip';
      case 'assigned':
        return 'Driver Assigned';
      case 'accepted':
        return 'Driver Accepted';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatServiceDetails = (serviceType: string, details: any) => {
    if (!details) return 'No details';
    switch (serviceType) {
      case 'Transportation':
        return `${details.pickup || details.pickupLocation || ''} → ${details.dropoff || details.dropoffLocation || ''}`;
      case 'Hotels':
        return `${details.city || ''} - ${details.hotel || details.hotelName || ''}`;
      case 'Events':
        return `${details.eventName || ''} at ${details.eventLocation || ''}`;
      case 'Custom Trips':
        return `${details.duration || ''} in ${details.regions || ''}`;
      default:
        return 'View details';
    }
  };

  const handlePayNow = (booking: Booking) => {
    toast({
      title: "Redirecting to Payment",
      description: "You'll complete payment for your selected booking.",
    });
    navigate('/payment', {
      state: { bookingId: booking.id, amount: booking.total_price }
    });
  };

  const hasDriver = (booking: Booking) => {
    return booking.assigned_driver_id && 
           (booking.status === 'accepted' || booking.status === 'on_trip' || booking.status === 'assigned');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservation History</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reservations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Collapsible
                key={booking.id}
                open={expandedBooking === booking.id}
                onOpenChange={(open) => setExpandedBooking(open ? booking.id : null)}
              >
                <Card className={`border ${hasDriver(booking) ? 'border-primary/30' : ''}`}>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{booking.service_type}</span>
                              {hasDriver(booking) && (
                                <Badge variant="outline" className="gap-1">
                                  <Car className="h-3 w-3" />
                                  Driver Assigned
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2">
                              <BookingStatusTimeline currentStatus={booking.status} compact />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatServiceDetails(booking.service_type, booking.service_details)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(booking.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">${booking.total_price?.toFixed(2) || '0.00'}</p>
                          </div>
                          
                          {booking.status === "pending" && (
                            <Button 
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayNow(booking);
                              }}
                            >
                              Pay Now
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="sm">
                            {expandedBooking === booking.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Booking Details */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Booking Details</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <p>Booking ID: {booking.id.slice(0, 8)}...</p>
                            <p>Created: {new Date(booking.created_at).toLocaleString()}</p>
                            {booking.payment_method && (
                              <p>Payment: {booking.payment_method}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Driver Info */}
                        {(hasDriver(booking) || ['accepted', 'on_trip', 'assigned'].includes(booking.status)) && (
                          <DriverInfoCard 
                            bookingId={booking.id}
                            showToggle={true}
                            initialVisibility={booking.show_driver_to_customer ?? true}
                          />
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
