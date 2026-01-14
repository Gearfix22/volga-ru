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

export interface GuideAvailability {
  id: string;
  guide_id: string;
  is_available: boolean;
  available_from: string;
  available_to: string;
  working_days: number[];
  languages: string[];
  service_areas: string[];
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
    .maybeSingle();

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

// Get guide availability
export async function getGuideAvailability(guideId: string): Promise<GuideAvailability | null> {
  const { data, error } = await supabase
    .from('guide_availability')
    .select('*')
    .eq('guide_id', guideId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching guide availability:', error);
    return null;
  }

  return data as GuideAvailability;
}

// Upsert guide availability
export async function upsertGuideAvailability(
  guideId: string,
  availability: Partial<Omit<GuideAvailability, 'id' | 'guide_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('guide_availability')
    .upsert({
      guide_id: guideId,
      ...availability,
      updated_at: new Date().toISOString()
    }, { onConflict: 'guide_id' });

  if (error) {
    console.error('Error updating guide availability:', error);
    return false;
  }

  return true;
}

// Get available guides for booking
export async function getAvailableGuides(
  language?: string,
  area?: string,
  dayOfWeek?: number,
  time?: string
): Promise<(Guide & { availability: GuideAvailability })[]> {
  // First get availability records
  let query = supabase
    .from('guide_availability')
    .select('*')
    .eq('is_available', true);

  if (language) {
    query = query.contains('languages', [language]);
  }
  if (area) {
    query = query.contains('service_areas', [area]);
  }
  if (dayOfWeek !== undefined) {
    query = query.contains('working_days', [dayOfWeek]);
  }

  const { data: availabilityData, error: availError } = await query;

  if (availError || !availabilityData?.length) {
    console.error('Error fetching availability:', availError);
    return [];
  }

  // Filter by time if provided
  let filteredAvail = availabilityData;
  if (time) {
    filteredAvail = availabilityData.filter(item => {
      return time >= item.available_from && time <= item.available_to;
    });
  }

  if (!filteredAvail.length) return [];

  // Fetch guide details for matching availability
  const guideIds = filteredAvail.map(a => a.guide_id);
  const { data: guidesData, error: guidesError } = await supabase
    .from('guides')
    .select('*')
    .in('id', guideIds)
    .eq('status', 'active');

  if (guidesError || !guidesData) {
    console.error('Error fetching guides:', guidesError);
    return [];
  }

  // Combine data
  return filteredAvail
    .map(avail => {
      const guide = guidesData.find(g => g.id === avail.guide_id);
      if (!guide) return null;
      return {
        ...guide,
        availability: avail as GuideAvailability
      };
    })
    .filter((item): item is Guide & { availability: GuideAvailability } => item !== null);
}

// Find best available guide for a booking based on tour details
export async function findBestAvailableGuide(
  tourDate: string,
  tourTime: string,
  language?: string,
  area?: string
): Promise<Guide | null> {
  // Parse the tour date to get day of week (0 = Sunday, 6 = Saturday)
  const date = new Date(tourDate);
  const dayOfWeek = date.getDay();

  // Get all guides with availability that matches criteria
  const availableGuides = await getAvailableGuides(language, area, dayOfWeek, tourTime);

  if (availableGuides.length === 0) {
    // Fallback: try without time constraint
    const guidesWithoutTime = await getAvailableGuides(language, area, dayOfWeek);
    if (guidesWithoutTime.length > 0) {
      return guidesWithoutTime[0];
    }

    // Fallback: try without area constraint
    const guidesWithoutArea = await getAvailableGuides(language, undefined, dayOfWeek, tourTime);
    if (guidesWithoutArea.length > 0) {
      return guidesWithoutArea[0];
    }

    // Fallback: try with just language
    const guidesWithLanguage = await getAvailableGuides(language);
    if (guidesWithLanguage.length > 0) {
      return guidesWithLanguage[0];
    }

    // Last fallback: return any active guide
    const { data: anyGuide } = await supabase
      .from('guides')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    
    return anyGuide as Guide | null;
  }

  // Score guides based on match quality
  const scoredGuides = availableGuides.map(guide => {
    let score = 0;
    
    // Language match from guide's main languages
    if (language && guide.languages?.includes(language)) {
      score += 3;
    }
    
    // Area match from availability
    if (area && guide.availability.service_areas?.includes(area)) {
      score += 2;
    }
    
    // Prefer guides with lower hourly rate for cost efficiency
    if (guide.hourly_rate) {
      score += Math.max(0, 100 - guide.hourly_rate) / 100;
    }
    
    return { guide, score };
  });

  // Sort by score descending and return the best match
  scoredGuides.sort((a, b) => b.score - a.score);
  
  return scoredGuides[0]?.guide || null;
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

// Clear guide location
export async function clearGuideLocation(guideId: string): Promise<boolean> {
  const { error } = await supabase
    .from('guide_locations')
    .delete()
    .eq('guide_id', guideId);

  if (error) {
    console.error('Error clearing guide location:', error);
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
    .maybeSingle();

  if (error) {
    console.error('Error fetching guide location:', error);
    return null;
  }

  return data as GuideLocation;
}

// Get guide notifications from unified_notifications table
export async function getGuideNotifications(guideId: string): Promise<GuideNotification[]> {
  const { data, error } = await supabase
    .from('unified_notifications')
    .select('*')
    .eq('recipient_id', guideId)
    .eq('recipient_type', 'guide')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching guide notifications:', error);
    return [];
  }

  // Map to GuideNotification format
  return (data || []).map(n => ({
    id: n.id,
    guide_id: n.recipient_id,
    booking_id: n.booking_id,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.is_read || false,
    created_at: n.created_at || ''
  }));
}

// Mark notification as read
export async function markGuideNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('unified_notifications')
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
