import { supabase } from '@/integrations/supabase/client';

export interface DriverLocation {
  id: string;
  driver_id: string;
  booking_id: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  updated_at: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  booking_id?: string;
}

// Update driver's location
export const updateDriverLocation = async (location: LocationUpdate): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[LocationService] Auth error:', authError.message);
      return { success: false, error: `Auth error: ${authError.message}` };
    }
    
    if (!user) {
      console.error('[LocationService] Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }

    // Validate coordinates
    if (!location.latitude || !location.longitude) {
      console.error('[LocationService] Invalid coordinates:', location);
      return { success: false, error: 'Invalid coordinates' };
    }

    console.log('[LocationService] Updating location:', { 
      driver_id: user.id, 
      booking_id: location.booking_id,
      coords: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` 
    });

    const { data, error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading ?? null,
        speed: location.speed ?? null,
        accuracy: location.accuracy ?? null,
        booking_id: location.booking_id || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'driver_id'
      })
      .select();

    if (error) {
      console.error('[LocationService] Error updating location:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check for RLS policy error
      if (error.code === '42501' || error.message.includes('policy')) {
        return { success: false, error: 'Permission denied - check driver role' };
      }
      
      return { success: false, error: error.message };
    }

    console.log('[LocationService] Location updated successfully:', data?.[0]?.id);
    return { success: true };
  } catch (error) {
    console.error('[LocationService] Unexpected error:', error);
    return { success: false, error: 'Unexpected error updating location' };
  }
};

// Get all driver locations (admin only)
export const getAllDriverLocations = async (): Promise<DriverLocation[]> => {
  try {
    console.log('[LocationService] Fetching all driver locations');
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*');

    if (error) {
      console.error('[LocationService] Error fetching locations:', error);
      return [];
    }

    console.log('[LocationService] Found', data?.length || 0, 'locations');
    return data || [];
  } catch (error) {
    console.error('[LocationService] Unexpected error:', error);
    return [];
  }
};

// Get driver location for a specific booking (customer view)
export const getDriverLocationForBooking = async (bookingId: string): Promise<DriverLocation | null> => {
  try {
    console.log('[LocationService] Fetching location for booking:', bookingId);
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle(); // Use maybeSingle to avoid error when no rows found

    if (error) {
      console.error('[LocationService] Error fetching driver location:', error);
      return null;
    }

    if (data) {
      console.log('[LocationService] Found driver location for booking');
    } else {
      console.log('[LocationService] No location found for booking');
    }
    
    return data;
  } catch (error) {
    console.error('[LocationService] Unexpected error:', error);
    return null;
  }
};

// Subscribe to driver location updates (for admin - all drivers)
export const subscribeToAllDriverLocations = (
  callback: (location: DriverLocation) => void
) => {
  console.log('[LocationService] Setting up realtime subscription for all driver locations');
  
  const channel = supabase
    .channel('all-driver-locations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'driver_locations'
      },
      (payload) => {
        console.log('[LocationService] Realtime location event:', payload.eventType);
        if (payload.new && payload.eventType !== 'DELETE') {
          callback(payload.new as DriverLocation);
        }
      }
    )
    .subscribe((status) => {
      console.log('[LocationService] Subscription status:', status);
    });

  return () => {
    console.log('[LocationService] Removing realtime subscription');
    supabase.removeChannel(channel);
  };
};

// Subscribe to specific driver location (for customer)
export const subscribeToDriverLocation = (
  bookingId: string,
  callback: (location: DriverLocation) => void
) => {
  const channel = supabase
    .channel(`driver-location-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'driver_locations',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        console.log('Driver location update for booking:', payload);
        if (payload.new) {
          callback(payload.new as DriverLocation);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Get Mapbox token from edge function
export const getMapboxToken = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.error('Error fetching Mapbox token:', error);
      return null;
    }

    return data?.token || null;
  } catch (error) {
    console.error('Error fetching Mapbox token:', error);
    return null;
  }
};

// Clear driver location when going offline
export const clearDriverLocation = async (): Promise<void> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[LocationService] Auth error clearing location:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('[LocationService] No user to clear location for');
      return;
    }

    console.log('[LocationService] Clearing location for driver:', user.id);
    
    const { error } = await supabase
      .from('driver_locations')
      .delete()
      .eq('driver_id', user.id);
      
    if (error) {
      console.error('[LocationService] Error clearing location:', error.message);
    } else {
      console.log('[LocationService] Location cleared successfully');
    }
  } catch (error) {
    console.error('[LocationService] Unexpected error clearing location:', error);
  }
};
