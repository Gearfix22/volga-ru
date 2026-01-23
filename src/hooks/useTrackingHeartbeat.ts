/**
 * useTrackingHeartbeat Hook
 * Hook for driver-side location tracking with heartbeat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getTrackingHeartbeat, 
  destroyTrackingHeartbeat,
  TrackingState, 
  TrackingCoordinates 
} from '@/services/tracking';

interface UseTrackingHeartbeatOptions {
  bookingId?: string;
  driverId?: string;
  bookingStatus?: string;
  autoStart?: boolean;
}

interface UseTrackingHeartbeatResult {
  state: TrackingState;
  currentPosition: TrackingCoordinates | null;
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
  isActive: boolean;
}

export const useTrackingHeartbeat = ({
  bookingId,
  driverId,
  bookingStatus,
  autoStart = true,
}: UseTrackingHeartbeatOptions): UseTrackingHeartbeatResult => {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    isBackground: false,
    lastUpdate: null,
    updateCount: 0,
    error: null,
    connectionStatus: 'disconnected',
  });
  const [currentPosition, setCurrentPosition] = useState<TrackingCoordinates | null>(null);
  
  const hasStarted = useRef(false);

  const start = useCallback(async (): Promise<boolean> => {
    if (!bookingId || !driverId || !bookingStatus) {
      console.warn('[useTrackingHeartbeat] Missing required params:', { bookingId, driverId, bookingStatus });
      return false;
    }

    const heartbeat = getTrackingHeartbeat();
    const success = await heartbeat.start(bookingId, driverId, bookingStatus);
    hasStarted.current = success;
    return success;
  }, [bookingId, driverId, bookingStatus]);

  const stop = useCallback(async (): Promise<void> => {
    const heartbeat = getTrackingHeartbeat();
    await heartbeat.stop();
    hasStarted.current = false;
  }, []);

  // Subscribe to state and location updates
  useEffect(() => {
    const heartbeat = getTrackingHeartbeat();
    
    const unsubState = heartbeat.onStateChange(setState);
    const unsubLocation = heartbeat.onLocationUpdate(setCurrentPosition);
    
    return () => {
      unsubState();
      unsubLocation();
    };
  }, []);

  // Auto-start when params are available
  useEffect(() => {
    if (!autoStart || hasStarted.current) return;
    
    if (bookingId && driverId && bookingStatus) {
      start();
    }
    
    return () => {
      // Don't stop on unmount if tracking is active - let it continue in background
    };
  }, [bookingId, driverId, bookingStatus, autoStart, start]);

  // Update booking status when it changes
  useEffect(() => {
    if (bookingStatus && hasStarted.current) {
      const heartbeat = getTrackingHeartbeat();
      heartbeat.updateBookingStatus(bookingStatus);
    }
  }, [bookingStatus]);

  // Cleanup on unmount (only if explicitly stopping)
  useEffect(() => {
    return () => {
      // Keep tracking running in background - don't destroy
      // destroyTrackingHeartbeat();
    };
  }, []);

  return {
    state,
    currentPosition,
    start,
    stop,
    isActive: state.isTracking,
  };
};

export default useTrackingHeartbeat;
