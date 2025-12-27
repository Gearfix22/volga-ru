import { supabase } from '@/integrations/supabase/client';

export interface Guide {
  id: string;
  full_name: string;
  phone: string;
  languages: string[];
  specialization: string[];
  hourly_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GuideLocation {
  id: string;
  guide_id: string;
  booking_id: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  updated_at: string;
}

export interface GuideNotification {
  id: string;
  guide_id: string;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Get all guides (admin only)
export async function getAllGuides(): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching guides:', error);
    return [];
  }

  return data as Guide[];
}

// Get active guides
export async function getActiveGuides(): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('status', 'active')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching active guides:', error);
    return [];
  }

  return data as Guide[];
}

// Get guide by ID
export async function getGuideById(guideId: string): Promise<Guide | null> {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('id', guideId)
    .single();

  if (error) {
    console.error('Error fetching guide:', error);
    return null;
  }

  return data as Guide;
}

// Create guide (admin only)
export async function createGuide(guide: Omit<Guide, 'id' | 'created_at' | 'updated_at'>): Promise<Guide | null> {
  const { data, error } = await supabase
    .from('guides')
    .insert(guide)
    .select()
    .single();

  if (error) {
    console.error('Error creating guide:', error);
    return null;
  }

  return data as Guide;
}

// Update guide (admin only)
export async function updateGuide(guideId: string, updates: Partial<Guide>): Promise<boolean> {
  const { error } = await supabase
    .from('guides')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', guideId);

  if (error) {
    console.error('Error updating guide:', error);
    return false;
  }

  return true;
}

// Delete guide (admin only)
export async function deleteGuide(guideId: string): Promise<boolean> {
  const { error } = await supabase
    .from('guides')
    .delete()
    .eq('id', guideId);

  if (error) {
    console.error('Error deleting guide:', error);
    return false;
  }

  return true;
}

// Update guide location
export async function updateGuideLocation(
  guideId: string,
  bookingId: string | null,
  latitude: number,
  longitude: number,
  heading?: number,
  speed?: number,
  accuracy?: number
): Promise<boolean> {
  const { error } = await supabase
    .from('guide_locations')
    .upsert({
      guide_id: guideId,
      booking_id: bookingId,
      latitude,
      longitude,
      heading: heading ?? null,
      speed: speed ?? null,
      accuracy: accuracy ?? null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'guide_id' });

  if (error) {
    console.error('Error updating guide location:', error);
    return false;
  }

  return true;
}

// Get guide location
export async function getGuideLocation(guideId: string): Promise<GuideLocation | null> {
  const { data, error } = await supabase
    .from('guide_locations')
    .select('*')
    .eq('guide_id', guideId)
    .single();

  if (error) {
    console.error('Error fetching guide location:', error);
    return null;
  }

  return data as GuideLocation;
}

// Get guide notifications
export async function getGuideNotifications(guideId: string): Promise<GuideNotification[]> {
  const { data, error } = await supabase
    .from('guide_notifications')
    .select('*')
    .eq('guide_id', guideId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching guide notifications:', error);
    return [];
  }

  return data as GuideNotification[];
}

// Mark notification as read
export async function markGuideNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('guide_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

// Get guide's assigned bookings
export async function getGuideBookings(guideId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, tourist_guide_bookings(*)')
    .eq('assigned_guide_id', guideId)
    .in('status', ['assigned', 'accepted', 'on_trip', 'completed'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching guide bookings:', error);
    return [];
  }

  return data;
}

// Subscribe to guide location updates
export function subscribeToGuideLocation(
  guideId: string,
  callback: (location: GuideLocation) => void
) {
  const channel = supabase
    .channel(`guide-location-${guideId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'guide_locations',
        filter: `guide_id=eq.${guideId}`
      },
      (payload) => {
        callback(payload.new as GuideLocation);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
