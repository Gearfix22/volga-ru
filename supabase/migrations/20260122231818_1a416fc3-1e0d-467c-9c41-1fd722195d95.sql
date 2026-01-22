-- =============================================
-- SMART REVIEW SYSTEM SCHEMA
-- =============================================

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  driver_id UUID,
  guide_id UUID,
  service_type TEXT NOT NULL,
  
  -- Ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Feedback
  feedback_text TEXT,
  positive_aspects TEXT[],
  improvement_areas TEXT[],
  
  -- Moderation
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'hidden')),
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  moderated_by UUID,
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up actions
  requires_followup BOOLEAN DEFAULT false,
  followup_type TEXT,
  followup_completed BOOLEAN DEFAULT false,
  followup_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Review prompts tracking (prevent duplicates, track timing)
CREATE TABLE public.review_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'dismissed', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, user_id)
);

-- Driver ratings aggregate view
CREATE VIEW public.driver_rating_stats AS
SELECT 
  driver_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(overall_rating)::numeric, 2) as avg_overall,
  ROUND(AVG(driver_rating)::numeric, 2) as avg_driver,
  ROUND(AVG(punctuality_rating)::numeric, 2) as avg_punctuality,
  ROUND(AVG(communication_rating)::numeric, 2) as avg_communication,
  COUNT(*) FILTER (WHERE overall_rating <= 2) as low_rating_count,
  COUNT(*) FILTER (WHERE overall_rating >= 4) as high_rating_count
FROM public.reviews
WHERE driver_id IS NOT NULL AND status = 'approved'
GROUP BY driver_id;

-- Guide ratings aggregate view
CREATE VIEW public.guide_rating_stats AS
SELECT 
  guide_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(overall_rating)::numeric, 2) as avg_overall,
  ROUND(AVG(punctuality_rating)::numeric, 2) as avg_punctuality,
  ROUND(AVG(communication_rating)::numeric, 2) as avg_communication,
  COUNT(*) FILTER (WHERE overall_rating <= 2) as low_rating_count,
  COUNT(*) FILTER (WHERE overall_rating >= 4) as high_rating_count
FROM public.reviews
WHERE guide_id IS NOT NULL AND status = 'approved'
GROUP BY guide_id;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_prompts ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Users can insert own reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
ON public.reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Drivers can view own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = driver_id AND has_role(auth.uid(), 'driver'::app_role));

CREATE POLICY "Guides can view own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = guide_id AND has_role(auth.uid(), 'guide'::app_role));

-- Review prompts policies
CREATE POLICY "Users can manage own prompts"
ON public.review_prompts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all prompts"
ON public.review_prompts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-flag low ratings trigger
CREATE OR REPLACE FUNCTION public.auto_flag_low_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Flag reviews with rating <= 2
  IF NEW.overall_rating <= 2 THEN
    NEW.is_flagged := true;
    NEW.flag_reason := 'Low rating auto-flagged for review';
    NEW.requires_followup := true;
    NEW.followup_type := 'support_contact';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_flag_reviews
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.auto_flag_low_ratings();

-- Schedule review prompt after booking completion
CREATE OR REPLACE FUNCTION public.schedule_review_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.user_id IS NOT NULL THEN
    -- Schedule prompt 10 minutes after completion
    INSERT INTO public.review_prompts (booking_id, user_id, scheduled_at)
    VALUES (NEW.id, NEW.user_id, now() + interval '10 minutes')
    ON CONFLICT (booking_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_schedule_review
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.schedule_review_prompt();

-- Notify on low rating for admin action
CREATE OR REPLACE FUNCTION public.notify_low_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_flagged = true THEN
    INSERT INTO public.unified_notifications (
      recipient_type,
      recipient_id,
      type,
      title,
      message,
      booking_id
    ) VALUES (
      'admin',
      '00000000-0000-0000-0000-000000000000',
      'low_rating',
      'Low rating received',
      'Booking ' || LEFT(NEW.booking_id::text, 8) || ' received ' || NEW.overall_rating || ' star rating. Follow-up required.',
      NEW.booking_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_low_rating
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_low_rating();

-- Indexes for performance
CREATE INDEX idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_driver_id ON public.reviews(driver_id);
CREATE INDEX idx_reviews_guide_id ON public.reviews(guide_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_flagged ON public.reviews(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_review_prompts_status ON public.review_prompts(status);
CREATE INDEX idx_review_prompts_scheduled ON public.review_prompts(scheduled_at) WHERE status = 'scheduled';