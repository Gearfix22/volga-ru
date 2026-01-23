/**
 * Tracking System Type Definitions
 * Production-ready types for real-time driver tracking
 */

export interface TrackingCoordinates {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  timestamp: number;
}

export interface TrackingUpdate {
  bookingId: string;
  driverId: string;
  coordinates: TrackingCoordinates;
  isBackground: boolean;
}

export interface TrackingConfig {
  // Update intervals (ms)
  foregroundInterval: number;
  backgroundInterval: number;
  
  // Distance filters (meters)
  minDistanceFilter: number;
  maxDistanceFilter: number;
  
  // Accuracy settings
  enableHighAccuracy: boolean;
  maxAccuracyThreshold: number; // Reject if accuracy > this (meters)
  
  // Timeout settings
  positionTimeout: number;
  maxAge: number;
  
  // Retry settings
  maxRetries: number;
  retryDelay: number;
}

export interface TrackingState {
  isTracking: boolean;
  isBackground: boolean;
  lastUpdate: Date | null;
  updateCount: number;
  error: string | null;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
}

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

export interface EnrichedDriverLocation {
  driver_id: string;
  booking_id: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  updated_at: string;
  // Enriched data
  driver_name: string;
  customer_name?: string;
  service_type?: string;
  booking_status?: string;
  destination?: {
    lat: number;
    lng: number;
    name: string;
  };
  eta?: {
    duration: number;
    distance: number;
    durationText: string;
    distanceText: string;
  } | null;
}

// Default tracking configuration - battery optimized
export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  foregroundInterval: 5000,      // 5 seconds when app is in foreground
  backgroundInterval: 15000,     // 15 seconds when in background
  minDistanceFilter: 10,         // Min 10m movement to trigger update
  maxDistanceFilter: 100,        // Max 100m before forcing update
  enableHighAccuracy: true,
  maxAccuracyThreshold: 50,      // Reject readings > 50m accuracy
  positionTimeout: 15000,        // 15s timeout per position request
  maxAge: 0,                     // Always get fresh position
  maxRetries: 3,
  retryDelay: 2000,
};

// Trip status that allows tracking
export const TRACKABLE_STATUSES = ['accepted', 'confirmed', 'on_trip'] as const;
export type TrackableStatus = typeof TRACKABLE_STATUSES[number];

export const isTrackableStatus = (status: string): status is TrackableStatus => {
  return TRACKABLE_STATUSES.includes(status as TrackableStatus);
};
