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
import { useLanguage } from '@/contexts/LanguageContext';
import { openExternalLink } from '@/hooks/useWebViewCompat';
import { cn } from '@/lib/utils';

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
  const { t, isRTL } = useLanguage();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDriver, setShowDriver] = useState(initialVisibility);
  const [bookingStatus, setBookingStatus] = useState<string>('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadDriverInfo();
    
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

  // Handle phone call - mobile compatible
  const handleCallDriver = () => {
    if (driver?.phone) {
      openExternalLink(`tel:${driver.phone}`);
    }
  };

  // Handle WhatsApp - mobile compatible
  const handleWhatsApp = () => {
    if (driver?.phone) {
      const cleanPhone = driver.phone.replace(/\D/g, '');
      openExternalLink(`https://wa.me/${cleanPhone}`);
    }
  };

  const getStatusMessage = () => {
    switch (bookingStatus) {
      case 'pending':
        return t('driverInfo.statusPending');
      case 'assigned':
        return t('driverInfo.statusAssigned');
      case 'confirmed':
        return t('driverInfo.statusConfirmed');
      case 'accepted':
        return t('driverInfo.statusAccepted');
      case 'on_trip':
        return t('driverInfo.statusOnTrip');
      case 'completed':
        return t('driverInfo.statusCompleted');
      default:
        return t('driverInfo.statusDefault');
    }
  };

  const canShowMap = driver && showDriver && ['accepted', 'on_trip'].includes(bookingStatus);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
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

  if (!driver) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Car className="h-5 w-5 text-primary" />
            {t('driverInfo.driverStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-3 rounded-full bg-muted">
              <Car className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
              {bookingStatus === 'confirmed' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('driverInfo.notificationHint')}
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
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Car className="h-5 w-5 text-primary" />
              {t('driverInfo.yourDriver')}
            </CardTitle>
            {showToggle && (
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
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
            <p className="text-sm text-muted-foreground">{t('driverInfo.driverDetailsHidden')}</p>
          ) : (
            <div className="space-y-4">
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className="p-3 rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{driver.full_name}</p>
                  <Badge 
                    variant="outline" 
                    className={
                      bookingStatus === 'on_trip' 
                        ? 'bg-blue-500/10 text-blue-600 border-blue-200' 
                        : 'bg-green-500/10 text-green-600 border-green-200'
                    }
                  >
                    {bookingStatus === 'on_trip' ? t('driverInfo.onTrip') : t('driverInfo.ready')}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Fixed: Use button with onClick for mobile compatibility */}
                <Button variant="outline" className="flex-1" onClick={handleCallDriver}>
                  <Phone className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t('driverInfo.callDriver')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleWhatsApp}>
                  <MessageCircle className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  WhatsApp
                </Button>
              </div>

              {canShowMap && (
                <Button 
                  variant={showMap ? 'secondary' : 'default'}
                  className="w-full"
                  onClick={() => setShowMap(!showMap)}
                >
                  <MapPin className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {showMap ? t('driverInfo.hideMap') : t('driverInfo.trackLocation')}
                </Button>
              )}

              {bookingStatus === 'on_trip' && !showMap && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-200">
                  <p className={cn("text-sm text-blue-700 font-medium flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <Car className="h-4 w-4" />
                    {t('driverInfo.onTheWay')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
