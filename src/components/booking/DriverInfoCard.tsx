import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Car, Phone, User, Eye, EyeOff, MessageCircle, MapPin } from 'lucide-react';
import { getDriverForBooking, toggleDriverVisibility, Driver } from '@/services/driverService';
import { supabase } from '@/integrations/supabase/client';
import { CustomerDriverMap } from './CustomerDriverMap';

interface DriverInfoCardProps {
  bookingId: string;
  showToggle?: boolean;
  initialVisibility?: boolean;
}

export const DriverInfoCard: React.FC<DriverInfoCardProps> = ({
  bookingId,
  showToggle = false,
  initialVisibility = true,
}) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDriver, setShowDriver] = useState(initialVisibility);
  const [bookingStatus, setBookingStatus] = useState<string>('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadDriverInfo();
    
    // Subscribe to booking changes for real-time updates
    const channel = supabase
      .channel(`booking-driver-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setBookingStatus(newData.status);
          if (newData.show_driver_to_customer !== showDriver) {
            setShowDriver(newData.show_driver_to_customer);
          }
          // Reload driver info when assignment changes
          if (newData.assigned_driver_id) {
            loadDriverInfo();
          } else {
            setDriver(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const loadDriverInfo = async () => {
    setLoading(true);
    const driverData = await getDriverForBooking(bookingId);
    setDriver(driverData);
    
    // Also get booking status
    const { data } = await supabase
      .from('bookings')
      .select('status, show_driver_to_customer')
      .eq('id', bookingId)
      .single();
    
    if (data) {
      setBookingStatus(data.status);
      setShowDriver(data.show_driver_to_customer ?? true);
    }
    
    setLoading(false);
  };

  const handleToggleVisibility = async (checked: boolean) => {
    setShowDriver(checked);
    await toggleDriverVisibility(bookingId, checked);
  };

  const getStatusMessage = () => {
    switch (bookingStatus) {
      case 'pending':
        return 'Waiting for confirmation...';
      case 'confirmed':
        return 'Booking confirmed - Assigning driver...';
      case 'accepted':
        return 'Driver assigned and ready!';
      case 'on_the_way':
        return 'Your driver is on the way!';
      case 'completed':
        return 'Trip completed';
      default:
        return 'Processing...';
    }
  };

  const canShowMap = driver && showDriver && ['accepted', 'on_the_way'].includes(bookingStatus);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="animate-pulse h-12 w-12 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="animate-pulse h-4 w-32 bg-muted rounded" />
              <div className="animate-pulse h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show status card if no driver yet
  if (!driver) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Driver Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-muted">
              <Car className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
              {bookingStatus === 'confirmed' && (
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be notified when a driver accepts your booking
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Your Driver
            </CardTitle>
            {showToggle && (
              <div className="flex items-center gap-2">
                <Switch
                  id="driver-visibility"
                  checked={showDriver}
                  onCheckedChange={handleToggleVisibility}
                />
                <Label htmlFor="driver-visibility" className="text-xs text-muted-foreground">
                  {showDriver ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!showDriver ? (
            <p className="text-sm text-muted-foreground">Driver details hidden</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{driver.full_name}</p>
                  <Badge 
                    variant="outline" 
                    className={
                      bookingStatus === 'on_the_way' 
                        ? 'bg-blue-500/10 text-blue-600 border-blue-200' 
                        : 'bg-green-500/10 text-green-600 border-green-200'
                    }
                  >
                    {bookingStatus === 'on_the_way' ? 'On The Way' : 'Ready'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`tel:${driver.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Driver
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a 
                    href={`https://wa.me/${driver.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              </div>

              {canShowMap && (
                <Button 
                  variant={showMap ? 'secondary' : 'default'}
                  className="w-full"
                  onClick={() => setShowMap(!showMap)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {showMap ? 'Hide Map' : 'Track Driver Location'}
                </Button>
              )}

              {bookingStatus === 'on_the_way' && !showMap && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Your driver is on the way to pick you up!
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Location Map */}
      {showMap && canShowMap && (
        <CustomerDriverMap 
          bookingId={bookingId}
          driverName={driver.full_name}
          driverPhone={driver.phone}
        />
      )}
    </div>
  );
};
