import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { updateDriverLocation, clearDriverLocation } from '@/services/locationService';
import { useToast } from '@/hooks/use-toast';

interface DriverLocationTrackerProps {
  activeBookingId?: string;
}

export const DriverLocationTracker: React.FC<DriverLocationTrackerProps> = ({ activeBookingId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      toast({
        title: 'Location Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    setIsTracking(true);
    setLocationError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, speed, accuracy } = position.coords;
        setCurrentLocation(position.coords);
        setLastUpdate(new Date());

        // Send location update to server
        const result = await updateDriverLocation({
          latitude,
          longitude,
          heading: heading || undefined,
          speed: speed || undefined,
          accuracy: accuracy || undefined,
          booking_id: activeBookingId,
        });

        if (!result.success) {
          console.error('Failed to update location:', result.error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(error.message);
        toast({
          title: 'Location Error',
          description: error.message,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Update every 5 seconds max
      }
    );

    toast({
      title: 'Location Tracking Started',
      description: 'Your location is now being shared with dispatch',
    });
  }, [activeBookingId, toast]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setIsTracking(false);
    setCurrentLocation(null);
    
    // Clear location from server
    await clearDriverLocation();
    
    toast({
      title: 'Location Tracking Stopped',
      description: 'Your location is no longer being shared',
    });
  }, [toast]);

  // Auto-start tracking when there's an active booking
  useEffect(() => {
    if (activeBookingId && !isTracking) {
      startTracking();
    }
  }, [activeBookingId, isTracking, startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <Card className={isTracking ? 'border-green-500/50 bg-green-500/5' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isTracking ? 'bg-green-500/20' : 'bg-muted'}`}>
              {isTracking ? (
                <Navigation className="h-5 w-5 text-green-500 animate-pulse" />
              ) : (
                <MapPin className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Location Sharing</span>
                <Badge variant={isTracking ? 'default' : 'secondary'} className={isTracking ? 'bg-green-600' : ''}>
                  {isTracking ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {currentLocation && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  {lastUpdate && ` • Updated ${lastUpdate.toLocaleTimeString()}`}
                </p>
              )}
              {locationError && (
                <p className="text-xs text-destructive mt-1">{locationError}</p>
              )}
            </div>
          </div>
          
          <Button
            variant={isTracking ? 'destructive' : 'default'}
            size="sm"
            onClick={isTracking ? stopTracking : startTracking}
          >
            {isTracking ? 'Stop Sharing' : 'Start Sharing'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverLocationTracker;
