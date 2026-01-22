/**
 * Review System Types
 */

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  driver_id: string | null;
  guide_id: string | null;
  service_type: string;
  
  // Ratings (1-5)
  overall_rating: number;
  driver_rating: number | null;
  punctuality_rating: number | null;
  communication_rating: number | null;
  value_rating: number | null;
  
  // Feedback
  feedback_text: string | null;
  positive_aspects: string[] | null;
  improvement_areas: string[] | null;
  
  // Moderation
  status: 'pending' | 'approved' | 'flagged' | 'hidden';
  is_flagged: boolean;
  flag_reason: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  
  // Follow-up
  requires_followup: boolean;
  followup_type: string | null;
  followup_completed: boolean;
  followup_notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface ReviewPrompt {
  id: string;
  booking_id: string;
  user_id: string;
  scheduled_at: string;
  sent_at: string | null;
  dismissed_at: string | null;
  completed_at: string | null;
  status: 'scheduled' | 'sent' | 'dismissed' | 'completed' | 'expired';
  created_at: string;
}

export interface ReviewSubmission {
  booking_id: string;
  overall_rating: number;
  driver_rating?: number;
  punctuality_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  feedback_text?: string;
  positive_aspects?: string[];
  improvement_areas?: string[];
}

export interface DriverRatingStats {
  driver_id: string;
  total_reviews: number;
  avg_overall: number;
  avg_driver: number;
  avg_punctuality: number;
  avg_communication: number;
  low_rating_count: number;
  high_rating_count: number;
}

export interface GuideRatingStats {
  guide_id: string;
  total_reviews: number;
  avg_overall: number;
  avg_punctuality: number;
  avg_communication: number;
  low_rating_count: number;
  high_rating_count: number;
}

// Quick feedback options
export const POSITIVE_ASPECTS = [
  'punctual',
  'friendly',
  'professional',
  'clean_vehicle',
  'good_communication',
  'safe_driving',
  'helpful',
  'knowledgeable'
] as const;

export const IMPROVEMENT_AREAS = [
  'late_arrival',
  'communication',
  'vehicle_condition',
  'driving_style',
  'route_choice',
  'attitude',
  'pricing',
  'overall_experience'
] as const;

export type PositiveAspect = typeof POSITIVE_ASPECTS[number];
export type ImprovementArea = typeof IMPROVEMENT_AREAS[number];
