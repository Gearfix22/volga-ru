/**
 * Tracking Heartbeat Service
 * Manages background-capable location tracking with heartbeat mechanism
 * 
 * Features:
 * - Foreground/background adaptive intervals
 * - GPS jitter filtering
 * - Automatic reconnection
 * - Battery optimization
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  TrackingConfig, 
  TrackingCoordinates, 
  TrackingState,
  DEFAULT_TRACKING_CONFIG,
  isTrackableStatus 
} from './types';

type StateCallback = (state: TrackingState) => void;
type LocationCallback = (coords: TrackingCoordinates) => void;

class TrackingHeartbeat {
  private config: TrackingConfig;
  private watchId: number | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  
  private bookingId: string | null = null;
  private driverId: string | null = null;
  private bookingStatus: string | null = null;
  
  private lastPosition: TrackingCoordinates | null = null;
  private lastSentPosition: TrackingCoordinates | null = null;
  private updateCount: number = 0;
  private isBackground: boolean = false;
  private retryCount: number = 0;
  
  private stateCallbacks: Set<StateCallback> = new Set();
  private locationCallbacks: Set<LocationCallback> = new Set();
  
  private state: TrackingState = {
    isTracking: false,
    isBackground: false,
    lastUpdate: null,
    updateCount: 0,
    error: null,
    connectionStatus: 'disconnected',
  };

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = { ...DEFAULT_TRACKING_CONFIG, ...config };
    
    // Listen for visibility changes (foreground/background)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  // Subscribe to state changes
  onStateChange(callback: StateCallback): () => void {
    this.stateCallbacks.add(callback);
    callback(this.state); // Immediate callback with current state
    return () => this.stateCallbacks.delete(callback);
  }

  // Subscribe to location updates
  onLocationUpdate(callback: LocationCallback): () => void {
    this.locationCallbacks.add(callback);
    return () => this.locationCallbacks.delete(callback);
  }

  private updateState(partial: Partial<TrackingState>): void {
    this.state = { ...this.state, ...partial };
    this.stateCallbacks.forEach(cb => cb(this.state));
  }

  private handleVisibilityChange = (): void => {
    const wasBackground = this.isBackground;
    this.isBackground = document.visibilityState === 'hidden';
    
    if (wasBackground !== this.isBackground) {
      console.log(`[TrackingHeartbeat] Visibility changed: ${this.isBackground ? 'background' : 'foreground'}`);
      this.updateState({ isBackground: this.isBackground });
      
      // Adjust update interval based on visibility
      if (this.state.isTracking) {
        this.restartHeartbeat();
      }
    }
  };

  // Start tracking for a specific booking
  async start(bookingId: string, driverId: string, bookingStatus: string): Promise<boolean> {
    if (!isTrackableStatus(bookingStatus)) {
      console.warn('[TrackingHeartbeat] Cannot start tracking for status:', bookingStatus);
      return false;
    }

    if (!navigator.geolocation) {
      this.updateState({ error: 'Geolocation not supported' });
      return false;
    }

    console.log('[TrackingHeartbeat] Starting tracking:', { bookingId, driverId, bookingStatus });
    
    this.bookingId = bookingId;
    this.driverId = driverId;
    this.bookingStatus = bookingStatus;
    this.updateCount = 0;
    this.retryCount = 0;
    
    this.updateState({
      isTracking: true,
      isBackground: false,
      error: null,
      connectionStatus: 'connected',
      updateCount: 0,
    });

    // Start GPS watch
    this.startGPSWatch();
    
    // Start heartbeat timer
    this.startHeartbeat();
    
    // Start polling fallback
    this.startPollingFallback();
    
    return true;
  }

  // Stop tracking
  async stop(): Promise<void> {
    console.log('[TrackingHeartbeat] Stopping tracking');
    
    // Clear GPS watch
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Clear location from server
    await this.clearServerLocation();
    
    // Reset state
    this.bookingId = null;
    this.driverId = null;
    this.bookingStatus = null;
    this.lastPosition = null;
    this.lastSentPosition = null;
    
    this.updateState({
      isTracking: false,
      isBackground: false,
      lastUpdate: null,
      updateCount: 0,
      error: null,
      connectionStatus: 'disconnected',
    });
  }

  // Update booking status (e.g., when trip starts)
  updateBookingStatus(status: string): void {
    console.log('[TrackingHeartbeat] Booking status updated:', status);
    this.bookingStatus = status;
    
    if (!isTrackableStatus(status)) {
      console.log('[TrackingHeartbeat] Status no longer trackable, stopping');
      this.stop();
    }
  }

  private startGPSWatch(): void {
    this.watchId = navigator.geolocation.watchPosition(
      this.handlePositionSuccess,
      this.handlePositionError,
      {
        enableHighAccuracy: this.config.enableHighAccuracy,
        timeout: this.config.positionTimeout,
        maximumAge: this.config.maxAge,
      }
    );
  }

  private handlePositionSuccess = (position: GeolocationPosition): void => {
    const { latitude, longitude, heading, speed, accuracy } = position.coords;
    
    // Filter out low-accuracy readings
    if (accuracy && accuracy > this.config.maxAccuracyThreshold) {
      console.log('[TrackingHeartbeat] Skipping low-accuracy reading:', accuracy);
      return;
    }
    
    const coords: TrackingCoordinates = {
      latitude,
      longitude,
      heading: heading ?? null,
      speed: speed ?? null,
      accuracy: accuracy ?? null,
      timestamp: position.timestamp,
    };
    
    // Apply jitter filter
    if (this.shouldSendUpdate(coords)) {
      this.lastPosition = coords;
      this.locationCallbacks.forEach(cb => cb(coords));
    }
    
    this.retryCount = 0; // Reset retry count on success
  };

  private handlePositionError = (error: GeolocationPositionError): void => {
    console.error('[TrackingHeartbeat] GPS error:', error.code, error.message);
    
    if (error.code === 1) { // PERMISSION_DENIED
      this.updateState({ error: 'Location permission denied' });
      this.stop();
      return;
    }
    
    // Retry for other errors
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      console.log(`[TrackingHeartbeat] Retrying... (${this.retryCount}/${this.config.maxRetries})`);
      this.updateState({ connectionStatus: 'reconnecting' });
      
      setTimeout(() => {
        if (this.watchId !== null) {
          navigator.geolocation.clearWatch(this.watchId);
        }
        this.startGPSWatch();
      }, this.config.retryDelay);
    } else {
      this.updateState({ 
        error: 'GPS unavailable',
        connectionStatus: 'disconnected',
      });
    }
  };

  // Check if update should be sent (jitter filter)
  private shouldSendUpdate(coords: TrackingCoordinates): boolean {
    if (!this.lastSentPosition) return true;
    
    const distance = this.calculateDistance(
      this.lastSentPosition.latitude,
      this.lastSentPosition.longitude,
      coords.latitude,
      coords.longitude
    );
    
    // Send if moved more than min distance
    if (distance >= this.config.minDistanceFilter) {
      return true;
    }
    
    // Force send if max distance exceeded (shouldn't happen but safety)
    if (distance >= this.config.maxDistanceFilter) {
      return true;
    }
    
    return false;
  }

  // Haversine distance calculation
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Start heartbeat timer
  private startHeartbeat(): void {
    const interval = this.isBackground 
      ? this.config.backgroundInterval 
      : this.config.foregroundInterval;
    
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, interval);
    
    // Send initial update immediately
    this.sendHeartbeat();
  }

  private restartHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.startHeartbeat();
  }

  // Send heartbeat update to server
  private async sendHeartbeat(): Promise<void> {
    if (!this.lastPosition || !this.bookingId || !this.driverId) {
      console.log('[TrackingHeartbeat] Skipping heartbeat - no position or booking');
      return;
    }

    const { latitude, longitude, heading, speed, accuracy } = this.lastPosition;
    
    console.log('[TrackingHeartbeat] Sending heartbeat:', {
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
      bookingId: this.bookingId,
      isBackground: this.isBackground,
    });

    try {
      // Update driver_locations table
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: this.driverId,
          booking_id: this.bookingId,
          latitude,
          longitude,
          heading: heading ?? null,
          speed: speed ?? null,
          accuracy: accuracy ?? null,
          updated_at: new Date().toISOString(),
          is_active: true,
        }, {
          onConflict: 'driver_id'
        });

      if (error) {
        console.error('[TrackingHeartbeat] Update error:', error);
        this.updateState({ connectionStatus: 'reconnecting' });
        return;
      }

      // Also record to route history for trip replay
      if (this.bookingStatus === 'on_trip' || this.bookingStatus === 'accepted') {
        await supabase
          .from('driver_route_history')
          .insert({
            booking_id: this.bookingId,
            driver_id: this.driverId,
            latitude,
            longitude,
            heading: heading ?? null,
            speed: speed ?? null,
          });
      }

      this.lastSentPosition = this.lastPosition;
      this.updateCount++;
      
      this.updateState({
        lastUpdate: new Date(),
        updateCount: this.updateCount,
        connectionStatus: 'connected',
        error: null,
      });

    } catch (err) {
      console.error('[TrackingHeartbeat] Network error:', err);
      this.updateState({ connectionStatus: 'reconnecting' });
    }
  }

  // Polling fallback (in case realtime fails)
  private startPollingFallback(): void {
    // Poll every 30 seconds as a safety net
    this.pollingInterval = setInterval(async () => {
      if (this.state.connectionStatus !== 'connected' && this.lastPosition) {
        console.log('[TrackingHeartbeat] Polling fallback triggered');
        await this.sendHeartbeat();
      }
    }, 30000);
  }

  // Clear location from server (when stopping tracking)
  private async clearServerLocation(): Promise<void> {
    if (!this.driverId) return;
    
    try {
      await supabase
        .from('driver_locations')
        .update({ is_active: false })
        .eq('driver_id', this.driverId);
      
      console.log('[TrackingHeartbeat] Server location cleared');
    } catch (err) {
      console.error('[TrackingHeartbeat] Error clearing location:', err);
    }
  }

  // Get current state
  getState(): TrackingState {
    return { ...this.state };
  }

  // Get current position
  getCurrentPosition(): TrackingCoordinates | null {
    return this.lastPosition ? { ...this.lastPosition } : null;
  }

  // Cleanup
  destroy(): void {
    this.stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.stateCallbacks.clear();
    this.locationCallbacks.clear();
  }
}

// Singleton instance
let heartbeatInstance: TrackingHeartbeat | null = null;

export const getTrackingHeartbeat = (config?: Partial<TrackingConfig>): TrackingHeartbeat => {
  if (!heartbeatInstance) {
    heartbeatInstance = new TrackingHeartbeat(config);
  }
  return heartbeatInstance;
};

export const destroyTrackingHeartbeat = (): void => {
  if (heartbeatInstance) {
    heartbeatInstance.destroy();
    heartbeatInstance = null;
  }
};

export { TrackingHeartbeat };
