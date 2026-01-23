import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useTrackingHeartbeat } from '@/hooks/useTrackingHeartbeat';
import { useToast } from '@/hooks/use-toast';
import { isTrackableStatus } from '@/services/tracking';

interface DriverLocationTrackerProps {
  activeBookingId?: string;
  bookingStatus?: string;
}

export const DriverLocationTracker: React.FC<DriverLocationTrackerProps> = ({ 
  activeBookingId,
  bookingStatus 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use the new heartbeat-based tracking
  const { 
    state, 
    currentPosition, 
    start, 
    stop,
    isActive 
  } = useTrackingHeartbeat({
    bookingId: activeBookingId,
    driverId: user?.id,
    bookingStatus,
    autoStart: true,
  });

  // Check if we should be tracking based on booking status
  const shouldTrack = activeBookingId && bookingStatus && isTrackableStatus(bookingStatus);

  const handleToggleTracking = async () => {
    if (isActive) {
      await stop();
      toast({
        title: 'Location Tracking Stopped',
        description: 'Your location is no longer being shared',
      });
    } else {
      const success = await start();
      if (success) {
        toast({
          title: 'Location Tracking Started',
          description: 'Your location is now being shared with dispatch',
        });
      }
    }
  };

    const { latitude, longitude, heading, speed, accuracy } = coords;
    
    console.log('[LocationTracker] Sending location update:', {
      bookingId: activeBookingId,
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
      status: bookingStatus
    });

    // Update driver_locations table
    const result = await updateDriverLocation({
      latitude,
      longitude,
      heading: heading || undefined,
      speed: speed || undefined,
      accuracy: accuracy || undefined,
      booking_id: activeBookingId,
    });

    // Also record to route history for trip replay
    if (bookingStatus === 'on_trip' || bookingStatus === 'accepted') {
      await recordRoutePoint(
        activeBookingId,
        user.id,
        latitude,
        longitude,
        heading || undefined,
        speed || undefined
      );
    }

    if (!result.success) {
      console.error('[LocationTracker] Failed to update location:', result.error);
      setLocationError(`Update failed: ${result.error}`);
    } else {
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
      setLocationError(null);
      console.log('[LocationTracker] Location update successful');
    }
  // Render connection status
  const renderConnectionIcon = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'reconnecting':
        return <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-3 w-3 text-red-500" />;
    }
  };

  if (!activeBookingId) {
    return null;
  }

  return (
    <Card className={isActive ? 'border-green-500/50 bg-green-500/5' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
              {isActive ? (
                <Navigation className="h-5 w-5 text-green-500 animate-pulse" />
              ) : (
                <MapPin className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Location Sharing</span>
                <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-600' : ''}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
                {isActive && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {renderConnectionIcon()}
                    ({state.updateCount} updates)
                  </span>
                )}
              </div>
              {currentPosition && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
                  {state.lastUpdate && ` • Updated ${state.lastUpdate.toLocaleTimeString()}`}
                </p>
              )}
              {state.error && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {state.error}
                </div>
              )}
              {!shouldTrack && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tracking available when booking is confirmed or in progress
                </p>
              )}
              {state.isBackground && isActive && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Background tracking active
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant={isActive ? 'destructive' : 'default'}
            size="sm"
            onClick={handleToggleTracking}
            disabled={!shouldTrack}
          >
            {isActive ? 'Stop Sharing' : 'Start Sharing'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverLocationTracker;
