-- Add RLS policies for user activity tracking tables

-- Enable RLS on form_interactions if not already enabled
ALTER TABLE public.form_interactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on search_queries if not already enabled  
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own form interactions
CREATE POLICY "Users can view own form interactions"
ON public.form_interactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to view their own search queries
CREATE POLICY "Users can view own search queries" 
ON public.search_queries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to insert their own form interactions
CREATE POLICY "Users can insert own form interactions"
ON public.form_interactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to insert their own search queries
CREATE POLICY "Users can insert own search queries"
ON public.search_queries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to insert their own page visits
CREATE POLICY "Users can insert own page visits"
ON public.page_visits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to insert their own user preferences
CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own user preferences
CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create a user activity history table that consolidates different activity types
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  activity_data jsonb NOT NULL DEFAULT '{}',
  activity_description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  session_id text,
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS on user_activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_activities
CREATE POLICY "Users can view own activities"
ON public.user_activities
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
ON public.user_activities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to automatically log booking activities
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log booking creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activities (
      user_id,
      activity_type,
      activity_data,
      activity_description,
      metadata
    )
    VALUES (
      NEW.user_id,
      'booking_created',
      jsonb_build_object(
        'booking_id', NEW.id,
        'service_type', NEW.service_type,
        'total_price', NEW.total_price,
        'status', NEW.status
      ),
      'Created a new booking for ' || NEW.service_type,
      jsonb_build_object(
        'transaction_id', NEW.transaction_id,
        'payment_method', NEW.payment_method
      )
    );
  END IF;
  
  -- Log booking updates
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.user_activities (
      user_id,
      activity_type,
      activity_data,
      activity_description,
      metadata
    )
    VALUES (
      NEW.user_id,
      'booking_status_changed',
      jsonb_build_object(
        'booking_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'service_type', NEW.service_type
      ),
      'Booking status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('total_price', NEW.total_price)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking activities
DROP TRIGGER IF EXISTS trigger_log_booking_activity ON public.bookings;
CREATE TRIGGER trigger_log_booking_activity
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_activity();