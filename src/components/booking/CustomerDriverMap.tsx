import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Car, Phone, User } from 'lucide-react';
import { 
  getDriverLocationForBooking, 
  subscribeToDriverLocation, 
  getMapboxToken,
  DriverLocation 
} from '@/services/locationService';
import { supabase } from '@/integrations/supabase/client';

interface CustomerDriverMapProps {
  bookingId: string;
  driverName?: string;
  driverPhone?: string;
}

export const CustomerDriverMap: React.FC<CustomerDriverMapProps> = ({ 
  bookingId, 
  driverName,
  driverPhone 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        const token = await getMapboxToken();
        if (!token) {
          setError('Failed to load map');
          setLoading(false);
          return;
        }

        mapboxgl.accessToken = token;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [37.6173, 55.7558], // Default center
          zoom: 12,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', async () => {
          // Load initial driver location
          const location = await getDriverLocationForBooking(bookingId);
          if (location) {
            setDriverLocation(location);
            setLastUpdate(new Date(location.updated_at));
            updateMarker(location);
            
            map.current?.flyTo({
              center: [location.longitude, location.latitude],
              zoom: 14,
            });
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [bookingId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToDriverLocation(bookingId, (location) => {
      setDriverLocation(location);
      setLastUpdate(new Date(location.updated_at));
      updateMarker(location);
    });

    return unsubscribe;
  }, [bookingId]);

  const updateMarker = (location: DriverLocation) => {
    if (!map.current) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([location.longitude, location.latitude]);
      
      // Update rotation if heading available
      if (location.heading !== null) {
        const el = markerRef.current.getElement();
        el.style.transform = `rotate(${location.heading}deg)`;
      }
    } else {
      // Create custom marker
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="relative">
          <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-3 border-white animate-pulse">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-primary"></div>
        </div>
      `;
      
      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    }

    // Smoothly pan to new location
    map.current?.panTo([location.longitude, location.latitude], {
      duration: 1000,
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          Driver Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Driver Info */}
        {(driverName || driverPhone) && (
          <div className="px-4 py-3 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{driverName || 'Your Driver'}</span>
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
            {lastUpdate && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
        
        {/* Map */}
        <div className="relative h-[300px] rounded-b-lg overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading driver location...</p>
              </div>
            </div>
          )}
          {!driverLocation && !loading && (
            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
              <div className="text-center">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Waiting for driver location...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Location will appear when driver starts sharing
                </p>
              </div>
            </div>
          )}
          <div ref={mapContainer} className="absolute inset-0" />
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDriverMap;
