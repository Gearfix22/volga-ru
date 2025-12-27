import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { updateGuideLocation, clearGuideLocation } from '@/services/guideService';
import { useToast } from '@/hooks/use-toast';

interface GuideLocationTrackerProps {
  activeBookingId?: string;
  bookingStatus?: string;
}

const TRACKABLE_STATUSES = ['accepted', 'on_trip'];

export const GuideLocationTracker: React.FC<GuideLocationTrackerProps> = ({ 
  activeBookingId,
  bookingStatus 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<GeolocationCoordinates | null>(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const shouldTrack = activeBookingId && bookingStatus && TRACKABLE_STATUSES.includes(bookingStatus);

  const sendLocationUpdate = useCallback(async (coords: GeolocationCoordinates) => {
    if (!activeBookingId || !user) return;

    const result = await updateGuideLocation(
      user.id,
      activeBookingId,
      coords.latitude,
      coords.longitude,
      coords.heading ?? undefined,
      coords.speed ?? undefined,
      coords.accuracy ?? undefined
    );

    if (result) {
      setLastUpdate(new Date());
      setLocationError(null);
    } else {
      setLocationError('Failed to update location');
    }
  }, [activeBookingId, user]);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation || !shouldTrack) return;

    setIsTracking(true);
    setLocationError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position.coords);
        lastPositionRef.current = position.coords;
        if (!updateIntervalRef.current) {
          sendLocationUpdate(position.coords);
        }
      },
      (error) => {
        setLocationError(error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    updateIntervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendLocationUpdate(lastPositionRef.current);
      }
    }, 10000);

    toast({ title: 'Location Tracking Started' });
  }, [shouldTrack, sendLocationUpdate, toast]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (updateIntervalRef.current !== null) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    setIsTracking(false);
    setCurrentLocation(null);
    lastPositionRef.current = null;
    
    if (user) {
      await clearGuideLocation(user.id);
    }
    
    toast({ title: 'Location Tracking Stopped' });
  }, [user, toast]);

  useEffect(() => {
    if (shouldTrack && !isTracking) {
      startTracking();
    } else if (!shouldTrack && isTracking) {
      stopTracking();
    }
  }, [shouldTrack, isTracking, startTracking, stopTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current !== null) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  if (!activeBookingId) return null;

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
                <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {locationError}
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant={isTracking ? 'destructive' : 'default'}
            size="sm"
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!shouldTrack}
          >
            {isTracking ? 'Stop' : 'Start'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuideLocationTracker;