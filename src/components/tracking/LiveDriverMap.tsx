/**
 * LiveDriverMap Component
 * Production-ready real-time driver tracking map with smooth animations
 * 
 * Features:
 * - Smooth marker animation (no jumping)
 * - Real-time polyline drawing
 * - ETA display
 * - Connection status indicator
 * - Auto-reconnection
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  MapPin, 
  Car, 
  Phone, 
  User, 
  Clock, 
  Navigation,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getMapboxToken } from '@/services/locationService';
import { useDriverTracking } from '@/hooks/useDriverTracking';
import { useRoutePolyline } from '@/hooks/useRoutePolyline';
import { 
  SmoothMarker, 
  updateRoutePolyline, 
  createDriverMarkerElement,
  createDestinationMarkerElement,
  fitMapToRoute
} from './mapUtils';
import { cn } from '@/lib/utils';

interface LiveDriverMapProps {
  bookingId: string;
  driverName?: string;
  driverPhone?: string;
  className?: string;
}

export const LiveDriverMap: React.FC<LiveDriverMapProps> = ({ 
  bookingId, 
  driverName,
  driverPhone,
  className
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<SmoothMarker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeSourceId = `route-${bookingId}`;
  
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Real-time tracking hook
  const { 
    location, 
    isLoading, 
    connectionStatus, 
    lastUpdate,
    refetch 
  } = useDriverTracking({ bookingId, enabled: true });
  
  // Route polyline hook
  const { coordinates: routeCoordinates } = useRoutePolyline({ 
    bookingId, 
    enabled: mapReady 
  });

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current) return;

      try {
        const token = await getMapboxToken();
        if (!token) {
          setMapError('Failed to load map configuration');
          setMapLoading(false);
          return;
        }

        mapboxgl.accessToken = token;
        
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [37.6173, 55.7558], // Default center
          zoom: 12,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          console.log('[LiveDriverMap] Map loaded');
          mapRef.current = map;
          setMapReady(true);
          setMapLoading(false);
        });

        map.on('error', (e) => {
          console.error('[LiveDriverMap] Map error:', e);
          setMapError('Map error occurred');
        });

      } catch (err) {
        console.error('[LiveDriverMap] Init error:', err);
        setMapError('Failed to initialize map');
        setMapLoading(false);
      }
    };

    initMap();

    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update driver marker when location changes
  useEffect(() => {
    if (!mapRef.current || !mapReady || !location) return;

    const map = mapRef.current;
    const { latitude, longitude, heading } = location;

    if (driverMarkerRef.current) {
      // Smooth animation to new position
      driverMarkerRef.current.animateTo(longitude, latitude, { duration: 1000 });
      
      // Update rotation if heading available
      if (heading !== null) {
        driverMarkerRef.current.setRotation(heading);
      }
    } else {
      // Create new marker
      const el = createDriverMarkerElement(true);
      const marker = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(map);
      
      driverMarkerRef.current = new SmoothMarker(marker);
      
      // Initial fly to driver location
      map.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 1500,
      });
    }
  }, [location, mapReady]);

  // Add destination marker
  useEffect(() => {
    if (!mapRef.current || !mapReady || !location?.destination) return;

    const map = mapRef.current;
    const { lat, lng, name } = location.destination;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLngLat([lng, lat]);
    } else {
      const el = createDestinationMarkerElement();
      destinationMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <p class="font-semibold">Destination</p>
              <p class="text-sm text-gray-600">${name}</p>
            </div>
          `)
        )
        .addTo(map);
    }
    
    // Fit bounds to show both markers
    if (location && destinationMarkerRef.current) {
      fitMapToRoute(
        map,
        [location.longitude, location.latitude],
        [lng, lat]
      );
    }
  }, [location?.destination, mapReady, location]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current || !mapReady || routeCoordinates.length < 2) return;
    
    try {
      updateRoutePolyline(mapRef.current, routeSourceId, routeCoordinates);
    } catch (err) {
      console.error('[LiveDriverMap] Route polyline error:', err);
    }
  }, [routeCoordinates, mapReady, routeSourceId]);

  // Render connection status badge
  const renderConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Wifi className="h-3 w-3 mr-1" />
            Live
          </Badge>
        );
      case 'reconnecting':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Reconnecting
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        );
    }
  };

  if (mapError) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{mapError}</p>
          <Button variant="outline" onClick={refetch} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            Live Tracking
          </CardTitle>
          {renderConnectionBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Driver Info & ETA */}
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{driverName || location?.driver_name || 'Your Driver'}</span>
            </div>
            {driverPhone && (
              <a 
                href={`tel:${driverPhone}`} 
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
          </div>
          
          {/* ETA Display */}
          {location?.eta && (
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    ETA: {location.eta.durationText}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {location.eta.distanceText} away
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Destination */}
          {location?.destination && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation className="h-4 w-4" />
              <span>To: {location.destination.name}</span>
            </div>
          )}

          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {/* Map */}
        <div className="relative h-[300px]">
          {(mapLoading || isLoading) && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  {mapLoading ? 'Loading map...' : 'Connecting to driver...'}
                </p>
              </div>
            </div>
          )}
          
          {!location && !isLoading && !mapLoading && (
            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
              <div className="text-center p-4">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Waiting for driver location...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Location will appear when driver starts the trip
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refetch}
                  className="mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
          
          <div ref={mapContainerRef} className="absolute inset-0" />
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveDriverMap;
