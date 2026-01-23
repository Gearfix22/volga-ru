/**
 * Realtime Location Sync Service
 * Handles real-time location subscription with fallback polling
 * 
 * Features:
 * - Supabase Realtime subscription
 * - Automatic polling fallback on connection issues
 * - Reconnection handling
 * - Exponential backoff
 */

import { supabase } from '@/integrations/supabase/client';
import { EnrichedDriverLocation, TrackingCoordinates } from './types';
import { calculateETA, ETAResult } from '@/services/etaService';

type LocationUpdateCallback = (location: EnrichedDriverLocation) => void;
type ConnectionStatusCallback = (status: 'connected' | 'reconnecting' | 'disconnected') => void;

interface SubscriptionOptions {
  bookingId?: string;
  driverId?: string;
  includeETA?: boolean;
}

class RealtimeLocationSync {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs: number = 5000;
  private maxPollIntervalMs: number = 30000;
  private lastSyncTimestamp: string = new Date().toISOString();
  
  private options: SubscriptionOptions = {};
  private onLocationUpdate: LocationUpdateCallback | null = null;
  private onConnectionStatus: ConnectionStatusCallback | null = null;
  
  private connectionStatus: 'connected' | 'reconnecting' | 'disconnected' = 'disconnected';
  private destination: { lat: number; lng: number; name: string } | null = null;

  constructor() {}

  // Subscribe to location updates for a specific booking
  subscribeToBooking(
    bookingId: string,
    onUpdate: LocationUpdateCallback,
    onStatus?: ConnectionStatusCallback
  ): () => void {
    this.options = { bookingId, includeETA: true };
    this.onLocationUpdate = onUpdate;
    this.onConnectionStatus = onStatus || null;
    
    // Fetch destination for ETA calculation
    this.fetchDestination(bookingId);
    
    // Start realtime subscription
    this.startRealtimeSubscription();
    
    // Start polling fallback
    this.startPollingFallback();
    
    // Fetch initial location
    this.fetchInitialLocation();
    
    return () => this.unsubscribe();
  }

  // Subscribe to all driver locations (admin view)
  subscribeToAllDrivers(
    onUpdate: LocationUpdateCallback,
    onStatus?: ConnectionStatusCallback
  ): () => void {
    this.options = { includeETA: true };
    this.onLocationUpdate = onUpdate;
    this.onConnectionStatus = onStatus || null;
    
    this.startRealtimeSubscription();
    this.startPollingFallback();
    this.fetchAllActiveLocations();
    
    return () => this.unsubscribe();
  }

  private async fetchDestination(bookingId: string): Promise<void> {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('service_details')
        .eq('id', bookingId)
        .single();

      if (booking?.service_details) {
        const details = booking.service_details as any;
        if (details.dropoff_coordinates) {
          this.destination = {
            lat: details.dropoff_coordinates.lat,
            lng: details.dropoff_coordinates.lng,
            name: details.dropoff_location || details.dropoffLocation || 'Destination',
          };
        }
      }
    } catch (err) {
      console.error('[RealtimeSync] Error fetching destination:', err);
    }
  }

  private startRealtimeSubscription(): void {
    const channelName = this.options.bookingId 
      ? `tracking:${this.options.bookingId}`
      : 'tracking:all';
    
    console.log('[RealtimeSync] Starting subscription:', channelName);
    
    this.channel = supabase.channel(channelName);
    
    // Build filter based on options
    const filter = this.options.bookingId 
      ? `booking_id=eq.${this.options.bookingId}`
      : undefined;
    
    this.channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter,
        },
        async (payload) => {
          console.log('[RealtimeSync] Realtime event:', payload.eventType);
          
          if (payload.eventType === 'DELETE') {
            return; // Handle deletion separately if needed
          }
          
          if (payload.new) {
            const location = payload.new as any;
            const enriched = await this.enrichLocation(location);
            if (enriched) {
              this.onLocationUpdate?.(enriched);
              this.lastSyncTimestamp = location.updated_at;
              this.pollIntervalMs = 5000; // Reset poll speed
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeSync] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.setConnectionStatus('reconnecting');
        } else if (status === 'CLOSED') {
          this.setConnectionStatus('disconnected');
        }
      });
  }

  private startPollingFallback(): void {
    const poll = async () => {
      try {
        let query = supabase
          .from('driver_locations')
          .select('*')
          .gt('updated_at', this.lastSyncTimestamp)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(10);

        if (this.options.bookingId) {
          query = query.eq('booking_id', this.options.bookingId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('[RealtimeSync] Polling error:', error);
          this.pollIntervalMs = Math.min(this.pollIntervalMs * 1.5, this.maxPollIntervalMs);
          return;
        }

        if (data && data.length > 0) {
          console.log('[RealtimeSync] Polling found updates:', data.length);
          
          for (const location of data) {
            const enriched = await this.enrichLocation(location);
            if (enriched) {
              this.onLocationUpdate?.(enriched);
            }
          }
          
          this.lastSyncTimestamp = data[0].updated_at;
          this.pollIntervalMs = 5000; // Reset on success
          
          if (this.connectionStatus !== 'connected') {
            this.setConnectionStatus('connected');
          }
        } else {
          // Slow down polling if no updates
          this.pollIntervalMs = Math.min(this.pollIntervalMs * 1.2, this.maxPollIntervalMs);
        }
      } catch (err) {
        console.error('[RealtimeSync] Polling network error:', err);
        this.pollIntervalMs = Math.min(this.pollIntervalMs * 1.5, this.maxPollIntervalMs);
      }
      
      // Schedule next poll
      this.pollingInterval = setTimeout(poll, this.pollIntervalMs);
    };
    
    // Start polling after initial delay
    this.pollingInterval = setTimeout(poll, this.pollIntervalMs);
  }

  private async fetchInitialLocation(): Promise<void> {
    if (!this.options.bookingId) return;
    
    try {
      const { data } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('booking_id', this.options.bookingId)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        const enriched = await this.enrichLocation(data);
        if (enriched) {
          this.onLocationUpdate?.(enriched);
          this.lastSyncTimestamp = data.updated_at;
        }
      }
    } catch (err) {
      console.error('[RealtimeSync] Error fetching initial location:', err);
    }
  }

  private async fetchAllActiveLocations(): Promise<void> {
    try {
      // Get all active bookings with drivers
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, assigned_driver_id, service_type, status, user_info, service_details')
        .not('assigned_driver_id', 'is', null)
        .in('status', ['assigned', 'accepted', 'on_trip', 'confirmed']);

      if (!bookings || bookings.length === 0) return;

      const driverIds = [...new Set(bookings.map(b => b.assigned_driver_id).filter(Boolean))];
      
      // Get locations
      const { data: locations } = await supabase
        .from('driver_locations')
        .select('*')
        .in('driver_id', driverIds);

      // Get driver names
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, full_name')
        .in('id', driverIds);

      const driverMap = new Map(drivers?.map(d => [d.id, d.full_name]) || []);
      const bookingMap = new Map(bookings.map(b => [b.assigned_driver_id!, b]));

      for (const location of locations || []) {
        const booking = bookingMap.get(location.driver_id);
        if (!booking) continue;

        const details = booking.service_details as any;
        let eta: ETAResult | null = null;

        if (details?.dropoff_coordinates && booking.status === 'on_trip') {
          eta = await calculateETA(
            location.longitude,
            location.latitude,
            details.dropoff_coordinates.lng,
            details.dropoff_coordinates.lat
          );
        }

        const enriched: EnrichedDriverLocation = {
          driver_id: location.driver_id,
          booking_id: location.booking_id,
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy,
          updated_at: location.updated_at,
          driver_name: driverMap.get(location.driver_id) || 'Unknown Driver',
          customer_name: (booking.user_info as any)?.fullName,
          service_type: booking.service_type,
          booking_status: booking.status,
          destination: details?.dropoff_coordinates ? {
            lat: details.dropoff_coordinates.lat,
            lng: details.dropoff_coordinates.lng,
            name: details.dropoff_location || details.dropoffLocation || 'Destination',
          } : undefined,
          eta,
        };

        this.onLocationUpdate?.(enriched);
      }
    } catch (err) {
      console.error('[RealtimeSync] Error fetching all locations:', err);
    }
  }

  private async enrichLocation(location: any): Promise<EnrichedDriverLocation | null> {
    try {
      // Get driver name
      const { data: driver } = await supabase
        .from('drivers')
        .select('full_name')
        .eq('id', location.driver_id)
        .single();

      // Get booking info if available
      let bookingInfo: any = null;
      if (location.booking_id) {
        const { data } = await supabase
          .from('bookings')
          .select('service_type, status, user_info, service_details')
          .eq('id', location.booking_id)
          .single();
        bookingInfo = data;
      }

      // Calculate ETA if destination available
      let eta: ETAResult | null = null;
      const dest = this.destination || (bookingInfo?.service_details?.dropoff_coordinates ? {
        lat: bookingInfo.service_details.dropoff_coordinates.lat,
        lng: bookingInfo.service_details.dropoff_coordinates.lng,
        name: bookingInfo.service_details.dropoff_location || 'Destination',
      } : null);

      if (dest && (bookingInfo?.status === 'on_trip' || bookingInfo?.status === 'accepted')) {
        eta = await calculateETA(
          location.longitude,
          location.latitude,
          dest.lng,
          dest.lat
        );
      }

      return {
        driver_id: location.driver_id,
        booking_id: location.booking_id,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        updated_at: location.updated_at,
        driver_name: driver?.full_name || 'Driver',
        customer_name: bookingInfo?.user_info?.fullName,
        service_type: bookingInfo?.service_type,
        booking_status: bookingInfo?.status,
        destination: dest || undefined,
        eta,
      };
    } catch (err) {
      console.error('[RealtimeSync] Error enriching location:', err);
      return null;
    }
  }

  private setConnectionStatus(status: 'connected' | 'reconnecting' | 'disconnected'): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.onConnectionStatus?.(status);
    }
  }

  unsubscribe(): void {
    console.log('[RealtimeSync] Unsubscribing');
    
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.onLocationUpdate = null;
    this.onConnectionStatus = null;
    this.setConnectionStatus('disconnected');
  }
}

export { RealtimeLocationSync };
