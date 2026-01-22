/**
 * Review Service
 * Handles all review-related operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { Review, ReviewPrompt, ReviewSubmission, DriverRatingStats, GuideRatingStats } from '@/types/review';

/**
 * Submit a review for a completed booking
 */
export async function submitReview(submission: ReviewSubmission): Promise<Review> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get booking details for driver/guide/service info
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, service_type, assigned_driver_id, assigned_guide_id')
    .eq('id', submission.booking_id)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  // Insert the review
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: submission.booking_id,
      user_id: user.id,
      driver_id: booking.assigned_driver_id,
      guide_id: booking.assigned_guide_id,
      service_type: booking.service_type,
      overall_rating: submission.overall_rating,
      driver_rating: submission.driver_rating,
      punctuality_rating: submission.punctuality_rating,
      communication_rating: submission.communication_rating,
      value_rating: submission.value_rating,
      feedback_text: submission.feedback_text,
      positive_aspects: submission.positive_aspects,
      improvement_areas: submission.improvement_areas
    })
    .select()
    .single();

  if (error) throw error;

  // Mark the prompt as completed
  await supabase
    .from('review_prompts')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('booking_id', submission.booking_id)
    .eq('user_id', user.id);

  return data as Review;
}

/**
 * Get pending review prompts for current user
 */
export async function getPendingReviewPrompts(): Promise<Array<{ prompt: ReviewPrompt; booking: any }>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // First get pending prompts
  const { data: prompts, error: promptError } = await supabase
    .from('review_prompts')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['scheduled', 'sent'])
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });

  if (promptError || !prompts || prompts.length === 0) {
    return [];
  }

  // Get booking details separately
  const bookingIds = prompts.map(p => p.booking_id);
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, service_type, service_details, assigned_driver_id, assigned_guide_id, created_at')
    .in('id', bookingIds);

  const bookingMap = new Map((bookings || []).map(b => [b.id, b]));

  // Update status to 'sent' for scheduled prompts
  const scheduledIds = prompts
    .filter(p => p.status === 'scheduled')
    .map(p => p.id);

  if (scheduledIds.length > 0) {
    await supabase
      .from('review_prompts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .in('id', scheduledIds);
  }

  // Combine prompts with bookings
  return prompts
    .filter(p => bookingMap.has(p.booking_id))
    .map(p => ({
      prompt: p as ReviewPrompt,
      booking: bookingMap.get(p.booking_id)
    }));
}

/**
 * Dismiss a review prompt
 */
export async function dismissReviewPrompt(promptId: string): Promise<void> {
  const { error } = await supabase
    .from('review_prompts')
    .update({ 
      status: 'dismissed',
      dismissed_at: new Date().toISOString()
    })
    .eq('id', promptId);

  if (error) throw error;
}

/**
 * Check if a review exists for a booking
 */
export async function hasReviewForBooking(bookingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle();

  return !!data;
}

/**
 * Get user's reviews
 */
export async function getUserReviews(): Promise<Review[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Review[];
}

/**
 * Get all reviews (admin only)
 */
export async function getAllReviews(filters?: {
  status?: string;
  is_flagged?: boolean;
  service_type?: string;
}): Promise<Review[]> {
  let query = supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.is_flagged !== undefined) {
    query = query.eq('is_flagged', filters.is_flagged);
  }
  if (filters?.service_type) {
    query = query.eq('service_type', filters.service_type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Review[];
}

/**
 * Moderate a review (admin only)
 */
export async function moderateReview(
  reviewId: string,
  action: 'approve' | 'flag' | 'hide',
  notes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const statusMap = {
    approve: 'approved',
    flag: 'flagged',
    hide: 'hidden'
  };

  const { error } = await supabase
    .from('reviews')
    .update({
      status: statusMap[action],
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
      is_flagged: action === 'flag',
      flag_reason: action === 'flag' ? (notes || 'Manually flagged by admin') : null
    })
    .eq('id', reviewId);

  if (error) throw error;
}

/**
 * Mark follow-up as completed (admin only)
 */
export async function completeFollowup(
  reviewId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({
      followup_completed: true,
      followup_notes: notes
    })
    .eq('id', reviewId);

  if (error) throw error;
}

/**
 * Get driver rating statistics
 */
export async function getDriverRatingStats(driverId?: string): Promise<DriverRatingStats[]> {
  let query = supabase
    .from('driver_rating_stats')
    .select('*');

  if (driverId) {
    query = query.eq('driver_id', driverId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as DriverRatingStats[];
}

/**
 * Get guide rating statistics
 */
export async function getGuideRatingStats(guideId?: string): Promise<GuideRatingStats[]> {
  let query = supabase
    .from('guide_rating_stats')
    .select('*');

  if (guideId) {
    query = query.eq('guide_id', guideId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as GuideRatingStats[];
}
