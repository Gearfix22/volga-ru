import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Car, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getAllDriverLocations, 
  subscribeToAllDriverLocations, 
  getMapboxToken,
  DriverLocation 
} from '@/services/locationService';
import { supabase } from '@/integrations/supabase/client';

interface DriverWithLocation extends DriverLocation {
  driver_name?: string;
  booking_service?: string;
}

export const AdminDriverMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverWithLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Fetch driver details
  const enrichDriverData = async (locations: DriverLocation[]): Promise<DriverWithLocation[]> => {
    const enriched: DriverWithLocation[] = [];
    
    for (const loc of locations) {
      let driver_name = 'Unknown Driver';
      let booking_service = '';
      
      // Get driver name
      const { data: driver } = await supabase
        .from('drivers')
        .select('full_name')
        .eq('id', loc.driver_id)
        .single();
      
      if (driver) {
        driver_name = driver.full_name;
      }
      
      // Get booking info if assigned
      if (loc.booking_id) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('service_type, status')
          .eq('id', loc.booking_id)
          .single();
        
        if (booking) {
          booking_service = `${booking.service_type} (${booking.status})`;
        }
      }
      
      enriched.push({
        ...loc,
        driver_name,
        booking_service,
      });
    }
    
    return enriched;
  };

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        const token = await getMapboxToken();
        if (!token) {
          setError('Failed to load map. Please check Mapbox configuration.');
          setLoading(false);
          return;
        }

        mapboxgl.accessToken = token;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [37.6173, 55.7558], // Moscow default
          zoom: 10,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', async () => {
          // Load initial driver locations
          const locations = await getAllDriverLocations();
          const enriched = await enrichDriverData(locations);
          setDrivers(enriched);
          
          // Add markers for each driver
          enriched.forEach(driver => {
            addOrUpdateMarker(driver);
          });
          
          // Fit bounds to show all drivers
          if (enriched.length > 0) {
            fitBoundsToDrivers(enriched);
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
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToAllDriverLocations(async (location) => {
      const enriched = await enrichDriverData([location]);
      if (enriched.length > 0) {
        const updatedDriver = enriched[0];
        
        setDrivers(prev => {
          const existing = prev.findIndex(d => d.driver_id === updatedDriver.driver_id);
          if (existing >= 0) {
            const newDrivers = [...prev];
            newDrivers[existing] = updatedDriver;
            return newDrivers;
          }
          return [...prev, updatedDriver];
        });
        
        addOrUpdateMarker(updatedDriver);
      }
    });

    return unsubscribe;
  }, []);

  const addOrUpdateMarker = (driver: DriverWithLocation) => {
    if (!map.current) return;

    const existingMarker = markersRef.current.get(driver.driver_id);
    
    if (existingMarker) {
      existingMarker.setLngLat([driver.longitude, driver.latitude]);
    } else {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          ${driver.heading ? `<div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>` : ''}
        </div>
      `;
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([driver.longitude, driver.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${driver.driver_name}</h3>
              ${driver.booking_service ? `<p class="text-sm text-gray-600">${driver.booking_service}</p>` : '<p class="text-sm text-gray-500">No active booking</p>'}
              <p class="text-xs text-gray-400 mt-1">Updated: ${new Date(driver.updated_at).toLocaleTimeString()}</p>
            </div>
          `)
        )
        .addTo(map.current);
      
      markersRef.current.set(driver.driver_id, marker);
    }
  };

  const fitBoundsToDrivers = (driversToFit: DriverWithLocation[]) => {
    if (!map.current || driversToFit.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    driversToFit.forEach(driver => {
      bounds.extend([driver.longitude, driver.latitude]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    const locations = await getAllDriverLocations();
    const enriched = await enrichDriverData(locations);
    setDrivers(enriched);
    
    // Clear old markers and add new ones
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    
    enriched.forEach(driver => {
      addOrUpdateMarker(driver);
    });
    
    if (enriched.length > 0) {
      fitBoundsToDrivers(enriched);
    }
    
    setLoading(false);
  };

  const focusOnDriver = (driver: DriverWithLocation) => {
    if (!map.current) return;
    
    setSelectedDriver(driver.driver_id);
    map.current.flyTo({
      center: [driver.longitude, driver.latitude],
      zoom: 15,
    });
    
    const marker = markersRef.current.get(driver.driver_id);
    marker?.togglePopup();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Map */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Live Driver Locations
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[500px] rounded-b-lg overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <div ref={mapContainer} className="absolute inset-0" />
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Active Drivers ({drivers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-2 max-h-[450px] overflow-y-auto">
            {drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No drivers currently sharing location
              </p>
            ) : (
              drivers.map(driver => (
                <button
                  key={driver.driver_id}
                  onClick={() => focusOnDriver(driver)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    selectedDriver === driver.driver_id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{driver.driver_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {driver.booking_id ? 'On Trip' : 'Available'}
                    </Badge>
                  </div>
                  {driver.booking_service && (
                    <p className="text-xs text-muted-foreground mt-1">{driver.booking_service}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(driver.updated_at).toLocaleTimeString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDriverMap;
