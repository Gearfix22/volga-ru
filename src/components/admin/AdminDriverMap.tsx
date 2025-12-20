import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Car, RefreshCw, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getAllDriverLocations, 
  subscribeToAllDriverLocations, 
  getMapboxToken,
  DriverLocation 
} from '@/services/locationService';
import { calculateETA, ETAResult } from '@/services/etaService';
import { supabase } from '@/integrations/supabase/client';

interface DriverWithLocation extends DriverLocation {
  driver_name?: string;
  booking_service?: string;
  customer_name?: string;
  pickup_location?: string;
  dropoff_location?: string;
  eta?: ETAResult | null;
}

export const AdminDriverMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverWithLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Fetch driver details - FIXED: Query drivers with active bookings, not just locations
  const fetchActiveDrivers = async (): Promise<DriverWithLocation[]> => {
    const enriched: DriverWithLocation[] = [];
    
    // First get all drivers with active bookings
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, assigned_driver_id, service_type, status, user_info, service_details')
      .not('assigned_driver_id', 'is', null)
      .in('status', ['assigned', 'accepted', 'on_trip', 'confirmed']);
    
    if (bookingsError) {
      console.error('Error fetching active bookings:', bookingsError);
      return [];
    }
    
    console.log('Active bookings with drivers:', activeBookings?.length || 0);
    
    // Get unique driver IDs from active bookings
    const driverIds = [...new Set((activeBookings || []).map(b => b.assigned_driver_id).filter(Boolean))];
    
    if (driverIds.length === 0) {
      console.log('No drivers with active bookings found');
      return [];
    }
    
    // Get driver info for all active drivers
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, full_name, status')
      .in('id', driverIds);
    
    const driverMap = new Map((drivers || []).map(d => [d.id, d]));
    
    // Get locations for these drivers
    const { data: locations } = await supabase
      .from('driver_locations')
      .select('*')
      .in('driver_id', driverIds);
    
    const locationMap = new Map((locations || []).map(l => [l.driver_id, l]));
    
    // Build enriched data for each active booking's driver
    for (const booking of (activeBookings || [])) {
      const driverId = booking.assigned_driver_id;
      if (!driverId) continue;
      
      const driver = driverMap.get(driverId);
      const location = locationMap.get(driverId);
      
      // Use location data if available, otherwise use default coordinates
      const lat = location?.latitude ?? 55.7558; // Moscow default
      const lng = location?.longitude ?? 37.6173;
      
      const details = booking.service_details as any;
      let eta: ETAResult | null = null;
      
      // Calculate ETA if we have destination coordinates and driver location
      if (details?.dropoff_coordinates && location && booking.status === 'on_trip') {
        eta = await calculateETA(
          location.longitude,
          location.latitude,
          details.dropoff_coordinates.lng,
          details.dropoff_coordinates.lat
        );
      }
      
      // Avoid duplicates - check if driver already added
      if (!enriched.find(e => e.driver_id === driverId)) {
        enriched.push({
          id: location?.id || driverId,
          driver_id: driverId,
          booking_id: booking.id,
          latitude: lat,
          longitude: lng,
          heading: location?.heading || null,
          speed: location?.speed || null,
          accuracy: location?.accuracy || null,
          updated_at: location?.updated_at || new Date().toISOString(),
          driver_name: driver?.full_name || 'Unknown Driver',
          booking_service: `${booking.service_type} (${booking.status})`,
          customer_name: (booking.user_info as any)?.fullName || 'Customer',
          pickup_location: details?.pickup_location || details?.pickupLocation || '',
          dropoff_location: details?.dropoff_location || details?.dropoffLocation || '',
          eta,
        });
      }
    }
    
    console.log('Enriched active drivers:', enriched.length);
    return enriched;
  };

  // Legacy function for location-based enrichment (backup)
  const enrichDriverData = async (locations: DriverLocation[]): Promise<DriverWithLocation[]> => {
    const enriched: DriverWithLocation[] = [];
    
    for (const loc of locations) {
      let driver_name = 'Unknown Driver';
      let booking_service = '';
      let customer_name = '';
      let pickup_location = '';
      let dropoff_location = '';
      let eta: ETAResult | null = null;
      
      // Get driver name
      const { data: driver } = await supabase
        .from('drivers')
        .select('full_name, status')
        .eq('id', loc.driver_id)
        .single();
      
      if (driver) {
        driver_name = driver.full_name;
      }
      
      // Get booking info if assigned
      if (loc.booking_id) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('service_type, status, user_info, service_details')
          .eq('id', loc.booking_id)
          .single();
        
        if (booking) {
          booking_service = `${booking.service_type} (${booking.status})`;
          customer_name = (booking.user_info as any)?.fullName || 'Customer';
          
          const details = booking.service_details as any;
          if (details) {
            pickup_location = details.pickup_location || details.pickupLocation || '';
            dropoff_location = details.dropoff_location || details.dropoffLocation || '';
            
            if (details.dropoff_coordinates && booking.status === 'on_trip') {
              eta = await calculateETA(
                loc.longitude,
                loc.latitude,
                details.dropoff_coordinates.lng,
                details.dropoff_coordinates.lat
              );
            }
          }
        }
      }
      
      enriched.push({
        ...loc,
        driver_name,
        booking_service: booking_service || 'Online - No active booking',
        customer_name,
        pickup_location,
        dropoff_location,
        eta,
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
          // FIXED: Fetch active drivers from bookings, not just location data
          const enriched = await fetchActiveDrivers();
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

  // Subscribe to real-time location updates
  useEffect(() => {
    console.log('[AdminDriverMap] Setting up realtime subscription');
    
    // Subscribe to driver_locations table changes
    const channel = supabase
      .channel('admin-driver-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations'
        },
        async (payload) => {
          console.log('[AdminDriverMap] Realtime location update:', payload.eventType);
          
          if (payload.eventType === 'DELETE') {
            // Remove marker when location is deleted (driver stopped tracking)
            const deletedId = (payload.old as any)?.driver_id;
            if (deletedId) {
              const marker = markersRef.current.get(deletedId);
              if (marker) {
                marker.remove();
                markersRef.current.delete(deletedId);
              }
              setDrivers(prev => prev.filter(d => d.driver_id !== deletedId));
            }
            return;
          }
          
          if (payload.new) {
            const location = payload.new as DriverLocation;
            console.log('[AdminDriverMap] New location for driver:', location.driver_id, {
              lat: location.latitude,
              lng: location.longitude,
              bookingId: location.booking_id
            });
            
            const enriched = await enrichDriverData([location]);
            if (enriched.length > 0) {
              const updatedDriver = enriched[0];
              
              // Only show drivers with active bookings (not completed/cancelled)
              if (updatedDriver.booking_service?.includes('completed') || 
                  updatedDriver.booking_service?.includes('cancelled')) {
                console.log('[AdminDriverMap] Skipping completed/cancelled booking');
                const marker = markersRef.current.get(updatedDriver.driver_id);
                if (marker) {
                  marker.remove();
                  markersRef.current.delete(updatedDriver.driver_id);
                }
                setDrivers(prev => prev.filter(d => d.driver_id !== updatedDriver.driver_id));
                return;
              }
              
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
          }
        }
      )
      .subscribe((status) => {
        console.log('[AdminDriverMap] Realtime subscription status:', status);
      });

    // Also subscribe to booking status changes to update/remove markers
    const bookingChannel = supabase
      .channel('admin-booking-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings'
        },
        async (payload) => {
          const booking = payload.new as any;
          console.log('[AdminDriverMap] Booking status changed:', booking.id, booking.status);
          
          // If booking is completed/cancelled, remove the driver marker
          if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
            const driverId = booking.assigned_driver_id;
            if (driverId) {
              console.log('[AdminDriverMap] Removing marker for completed booking, driver:', driverId);
              const marker = markersRef.current.get(driverId);
              if (marker) {
                marker.remove();
                markersRef.current.delete(driverId);
              }
              setDrivers(prev => prev.filter(d => d.driver_id !== driverId));
            }
          } else if (booking.assigned_driver_id && 
                     ['assigned', 'accepted', 'on_trip', 'confirmed'].includes(booking.status)) {
            // Refresh driver list when a new driver is assigned or status changes to active
            const enriched = await fetchActiveDrivers();
            setDrivers(enriched);
            enriched.forEach(driver => addOrUpdateMarker(driver));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[AdminDriverMap] Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
      supabase.removeChannel(bookingChannel);
    };
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
          new mapboxgl.Popup({ offset: 25, maxWidth: '300px' }).setHTML(`
            <div class="p-3 space-y-2">
              <h3 class="font-semibold text-base">${driver.driver_name}</h3>
              ${driver.customer_name ? `<p class="text-sm"><span class="text-gray-500">Customer:</span> ${driver.customer_name}</p>` : ''}
              ${driver.booking_service ? `<p class="text-sm text-gray-600">${driver.booking_service}</p>` : '<p class="text-sm text-gray-500">No active booking</p>'}
              ${driver.dropoff_location ? `<p class="text-sm"><span class="text-gray-500">Destination:</span> ${driver.dropoff_location}</p>` : ''}
              ${driver.eta ? `
                <div class="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                  <span class="font-semibold text-green-700">ETA: ${driver.eta.durationText}</span>
                  <span class="text-sm text-green-600">(${driver.eta.distanceText})</span>
                </div>
              ` : ''}
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
    // FIXED: Use fetchActiveDrivers instead of location-only approach
    const enriched = await fetchActiveDrivers();
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

      {/* Driver List - Shows all active drivers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Active Drivers ({drivers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-2 max-h-[450px] overflow-y-auto">
            {drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active drivers online
              </p>
            ) : (
              drivers.map(driver => (
                <button
                  key={driver.driver_id}
                  onClick={() => focusOnDriver(driver)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDriver === driver.driver_id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{driver.driver_name}</span>
                    <Badge className={`text-xs ${
                      driver.booking_service?.includes('on_trip') ? 'bg-green-600' :
                      driver.booking_service?.includes('accepted') ? 'bg-blue-600' :
                      driver.booking_service?.includes('assigned') ? 'bg-yellow-600' :
                      'bg-gray-500'
                    }`}>
                      {driver.booking_service?.includes('on_trip') ? 'On Trip' :
                       driver.booking_service?.includes('accepted') ? 'Accepted' :
                       driver.booking_service?.includes('assigned') ? 'Assigned' :
                       'Online'}
                    </Badge>
                  </div>

                  {driver.customer_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Customer: {driver.customer_name}
                    </p>
                  )}
                  {driver.dropoff_location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Navigation className="h-3 w-3" />
                      <span className="truncate">{driver.dropoff_location}</span>
                    </div>
                  )}
                  {driver.eta && (
                    <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-medium">ETA: {driver.eta.durationText}</span>
                      <span className="text-xs">({driver.eta.distanceText})</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
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
