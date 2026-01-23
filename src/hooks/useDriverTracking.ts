/**
 * useDriverTracking Hook
 * Production-ready hook for real-time driver tracking
 * 
 * Features:
 * - Real-time location updates with fallback polling
 * - Automatic reconnection
 * - ETA calculation
 * - Connection status monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeLocationSync, EnrichedDriverLocation } from '@/services/tracking';

interface UseDriverTrackingOptions {
  bookingId: string;
  enabled?: boolean;
}

interface UseDriverTrackingResult {
  location: EnrichedDriverLocation | null;
  isLoading: boolean;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  lastUpdate: Date | null;
  refetch: () => void;
}

export const useDriverTracking = ({ 
  bookingId, 
  enabled = true 
}: UseDriverTrackingOptions): UseDriverTrackingResult => {
  const [location, setLocation] = useState<EnrichedDriverLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const syncRef = useRef<RealtimeLocationSync | null>(null);
  const initialFetchDone = useRef(false);

  const handleLocationUpdate = useCallback((newLocation: EnrichedDriverLocation) => {
    console.log('[useDriverTracking] Location update received:', {
      lat: newLocation.latitude.toFixed(6),
      lng: newLocation.longitude.toFixed(6),
      eta: newLocation.eta?.durationText,
    });
    
    setLocation(newLocation);
    setLastUpdate(new Date());
    setIsLoading(false);
    initialFetchDone.current = true;
  }, []);

  const handleStatusChange = useCallback((status: 'connected' | 'reconnecting' | 'disconnected') => {
    console.log('[useDriverTracking] Connection status:', status);
    setConnectionStatus(status);
  }, []);

  const refetch = useCallback(() => {
    if (syncRef.current) {
      syncRef.current.unsubscribe();
    }
    
    setIsLoading(true);
    initialFetchDone.current = false;
    
    const sync = new RealtimeLocationSync();
    sync.subscribeToBooking(bookingId, handleLocationUpdate, handleStatusChange);
    syncRef.current = sync;
  }, [bookingId, handleLocationUpdate, handleStatusChange]);

  useEffect(() => {
    if (!enabled || !bookingId) {
      setIsLoading(false);
      return;
    }

    console.log('[useDriverTracking] Starting subscription for booking:', bookingId);
    
    const sync = new RealtimeLocationSync();
    const unsubscribe = sync.subscribeToBooking(bookingId, handleLocationUpdate, handleStatusChange);
    syncRef.current = sync;
    
    // Set timeout for initial load
    const timeout = setTimeout(() => {
      if (!initialFetchDone.current) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      console.log('[useDriverTracking] Cleaning up subscription');
      clearTimeout(timeout);
      unsubscribe();
      syncRef.current = null;
    };
  }, [bookingId, enabled, handleLocationUpdate, handleStatusChange]);

  return {
    location,
    isLoading,
    connectionStatus,
    lastUpdate,
    refetch,
  };
};

export default useDriverTracking;
