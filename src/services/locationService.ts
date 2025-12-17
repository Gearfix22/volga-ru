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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        booking_id: location.booking_id || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'driver_id'
      });

    if (error) {
      console.error('Error updating location:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating driver location:', error);
    return { success: false, error: 'Failed to update location' };
  }
};

// Get all driver locations (admin only)
export const getAllDriverLocations = async (): Promise<DriverLocation[]> => {
  try {
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*');

    if (error) {
      console.error('Error fetching driver locations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching driver locations:', error);
    return [];
  }
};

// Get driver location for a specific booking (customer view)
export const getDriverLocationForBooking = async (bookingId: string): Promise<DriverLocation | null> => {
  try {
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching driver location:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching driver location:', error);
    return null;
  }
};

// Subscribe to driver location updates (for admin - all drivers)
export const subscribeToAllDriverLocations = (
  callback: (location: DriverLocation) => void
) => {
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
        console.log('Driver location update:', payload);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('driver_locations')
      .delete()
      .eq('driver_id', user.id);
  } catch (error) {
    console.error('Error clearing driver location:', error);
  }
};
