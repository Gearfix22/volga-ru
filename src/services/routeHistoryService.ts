import { supabase } from '@/integrations/supabase/client';

export interface RoutePoint {
  id: string;
  booking_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
}

/**
 * Record a route point (driver only)
 */
export async function recordRoutePoint(
  bookingId: string,
  driverId: string,
  latitude: number,
  longitude: number,
  heading?: number,
  speed?: number
): Promise<boolean> {
  const { error } = await supabase
    .from('driver_route_history')
    .insert({
      booking_id: bookingId,
      driver_id: driverId,
      latitude,
      longitude,
      heading: heading ?? null,
      speed: speed ?? null
    });

  if (error) {
    console.error('Error recording route point:', error);
    return false;
  }

  return true;
}

/**
 * Get route history for a booking
 */
export async function getBookingRouteHistory(bookingId: string): Promise<RoutePoint[]> {
  const { data, error } = await supabase
    .from('driver_route_history')
    .select('*')
    .eq('booking_id', bookingId)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Error fetching route history:', error);
    return [];
  }

  return data as RoutePoint[];
}

/**
 * Get route as GeoJSON for Mapbox
 */
export async function getRouteAsGeoJSON(bookingId: string): Promise<GeoJSON.LineString | null> {
  const points = await getBookingRouteHistory(bookingId);
  
  if (points.length < 2) {
    return null;
  }

  return {
    type: 'LineString',
    coordinates: points.map(p => [p.longitude, p.latitude])
  };
}

/**
 * Get route statistics
 */
export async function getRouteStats(bookingId: string): Promise<{
  totalPoints: number;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
} | null> {
  const points = await getBookingRouteHistory(bookingId);
  
  if (points.length === 0) {
    return null;
  }

  const startTime = points[0].recorded_at;
  const endTime = points[points.length - 1].recorded_at;
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  return {
    totalPoints: points.length,
    startTime,
    endTime,
    durationMinutes
  };
}

/**
 * Subscribe to route updates for a booking
 */
export function subscribeToRouteUpdates(
  bookingId: string,
  callback: (point: RoutePoint) => void
) {
  const channel = supabase
    .channel(`route-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_route_history',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        callback(payload.new as RoutePoint);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
