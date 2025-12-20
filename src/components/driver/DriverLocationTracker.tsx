import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { updateDriverLocation, clearDriverLocation } from '@/services/locationService';
import { useToast } from '@/hooks/use-toast';

interface DriverLocationTrackerProps {
  activeBookingId?: string;
  bookingStatus?: string; // ADDED: Only track when status allows
}

// Valid statuses for location tracking
const TRACKABLE_STATUSES = ['accepted', 'confirmed', 'on_trip'];

export const DriverLocationTracker: React.FC<DriverLocationTrackerProps> = ({ 
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
  const [updateCount, setUpdateCount] = useState(0);

  // Check if we should be tracking based on booking status
  const shouldTrack = activeBookingId && bookingStatus && TRACKABLE_STATUSES.includes(bookingStatus);

  // Send location update to server
  const sendLocationUpdate = useCallback(async (coords: GeolocationCoordinates) => {
    if (!activeBookingId) {
      console.warn('[LocationTracker] No active booking ID, skipping update');
      return;
    }

    const { latitude, longitude, heading, speed, accuracy } = coords;
    
    console.log('[LocationTracker] Sending location update:', {
      bookingId: activeBookingId,
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
      status: bookingStatus
    });

    const result = await updateDriverLocation({
      latitude,
      longitude,
      heading: heading || undefined,
      speed: speed || undefined,
      accuracy: accuracy || undefined,
      booking_id: activeBookingId,
    });

    if (!result.success) {
      console.error('[LocationTracker] Failed to update location:', result.error);
      setLocationError(`Update failed: ${result.error}`);
    } else {
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
      setLocationError(null);
      console.log('[LocationTracker] Location update successful');
    }
  }, [activeBookingId, bookingStatus]);

  // Start GPS tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      const error = 'Geolocation not supported by your browser';
      console.error('[LocationTracker]', error);
      setLocationError(error);
      toast({
        title: 'Location Error',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    if (!shouldTrack) {
      console.warn('[LocationTracker] Cannot start tracking - invalid status:', bookingStatus);
      return;
    }

    console.log('[LocationTracker] Starting GPS tracking for booking:', activeBookingId);
    setIsTracking(true);
    setLocationError(null);

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { coords } = position;
        setCurrentLocation(coords);
        lastPositionRef.current = coords;
        
        // Send update immediately on first position
        if (!updateIntervalRef.current) {
          sendLocationUpdate(coords);
        }
      },
      (error) => {
        console.error('[LocationTracker] Geolocation error:', error.code, error.message);
        setLocationError(error.message);
        
        // Only show toast for permission denied or unavailable
        if (error.code === 1 || error.code === 2) {
          toast({
            title: 'Location Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Always get fresh position
      }
    );

    // Set up interval to send updates every 10 seconds
    updateIntervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendLocationUpdate(lastPositionRef.current);
      }
    }, 10000);

    toast({
      title: 'Location Tracking Started',
      description: 'Your location is now being shared with dispatch',
    });
  }, [activeBookingId, bookingStatus, shouldTrack, sendLocationUpdate, toast]);

  // Stop GPS tracking
  const stopTracking = useCallback(async () => {
    console.log('[LocationTracker] Stopping tracking');
    
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
    
    // Clear location from server
    await clearDriverLocation();
    
    toast({
      title: 'Location Tracking Stopped',
      description: 'Your location is no longer being shared',
    });
  }, [toast]);

  // Auto-start tracking when there's an active booking with valid status
  useEffect(() => {
    if (shouldTrack && !isTracking) {
      console.log('[LocationTracker] Auto-starting tracking for status:', bookingStatus);
      startTracking();
    } else if (!shouldTrack && isTracking) {
      console.log('[LocationTracker] Auto-stopping tracking - status changed to:', bookingStatus);
      stopTracking();
    }
  }, [shouldTrack, isTracking, startTracking, stopTracking, bookingStatus]);

  // Cleanup on unmount
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

  // Don't show if booking status doesn't allow tracking
  if (!activeBookingId) {
    return null;
  }

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
                {updateCount > 0 && (
                  <span className="text-xs text-muted-foreground">({updateCount} updates)</span>
                )}
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
              {!shouldTrack && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tracking available when booking is confirmed or in progress
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant={isTracking ? 'destructive' : 'default'}
            size="sm"
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!shouldTrack}
          >
            {isTracking ? 'Stop Sharing' : 'Start Sharing'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverLocationTracker;
