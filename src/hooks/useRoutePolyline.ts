/**
 * useRoutePolyline Hook
 * Manages route polyline data with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoutePoint } from '@/services/tracking/types';

interface UseRoutePolylineOptions {
  bookingId: string;
  enabled?: boolean;
}

interface UseRoutePolylineResult {
  coordinates: [number, number][];
  routePoints: RoutePoint[];
  isLoading: boolean;
  addPoint: (lat: number, lng: number) => void;
}

export const useRoutePolyline = ({
  bookingId,
  enabled = true,
}: UseRoutePolylineOptions): UseRoutePolylineResult => {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch existing route history
  const fetchRouteHistory = useCallback(async () => {
    if (!bookingId) return;
    
    try {
      const { data, error } = await supabase
        .from('driver_route_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('[useRoutePolyline] Error fetching history:', error);
        return;
      }

      setRoutePoints(data || []);
      setIsLoading(false);
    } catch (err) {
      console.error('[useRoutePolyline] Network error:', err);
      setIsLoading(false);
    }
  }, [bookingId]);

  // Add point locally (optimistic update)
  const addPoint = useCallback((lat: number, lng: number) => {
    const newPoint: RoutePoint = {
      id: `local-${Date.now()}`,
      booking_id: bookingId,
      driver_id: '',
      latitude: lat,
      longitude: lng,
      heading: null,
      speed: null,
      recorded_at: new Date().toISOString(),
    };
    
    setRoutePoints(prev => [...prev, newPoint]);
  }, [bookingId]);

  // Subscribe to real-time route updates
  useEffect(() => {
    if (!enabled || !bookingId) return;

    fetchRouteHistory();

    const channel = supabase
      .channel(`route-polyline:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_route_history',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newPoint = payload.new as RoutePoint;
          console.log('[useRoutePolyline] New point received');
          setRoutePoints(prev => [...prev, newPoint]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [bookingId, enabled, fetchRouteHistory]);

  // Convert to coordinates array for Mapbox
  const coordinates: [number, number][] = routePoints.map(p => [p.longitude, p.latitude]);

  return {
    coordinates,
    routePoints,
    isLoading,
    addPoint,
  };
};

export default useRoutePolyline;
