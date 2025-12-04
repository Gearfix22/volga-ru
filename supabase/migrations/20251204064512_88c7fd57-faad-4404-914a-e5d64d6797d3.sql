-- Create notifications table for admin alerts
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  target_admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins can view their own notifications or all if they're the owner
CREATE POLICY "Admins can view own notifications"
ON public.notifications FOR SELECT
USING (
  target_admin_id = auth.uid() OR 
  target_admin_id IS NULL AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update own notifications"
ON public.notifications FOR UPDATE
USING (target_admin_id = auth.uid() OR target_admin_id IS NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_notifications_target_admin ON public.notifications(target_admin_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to notify admins on new booking
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user RECORD;
  booking_service TEXT;
BEGIN
  booking_service := NEW.service_type;
  
  -- Create notification for all admins (target_admin_id = NULL means all admins)
  INSERT INTO public.notifications (type, message, booking_id, target_admin_id)
  VALUES (
    'new_booking',
    'New ' || booking_service || ' booking received - ID: ' || LEFT(NEW.id::text, 8),
    NEW.id,
    NULL
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new bookings
CREATE TRIGGER on_new_booking_notify_admins
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_booking();

-- Function to create notification on booking status change
CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (type, message, booking_id, target_admin_id)
    VALUES (
      'status_change',
      'Booking ' || LEFT(NEW.id::text, 8) || ' status changed to ' || NEW.status,
      NEW.id,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for status changes
CREATE TRIGGER on_booking_status_change_notify
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_booking_status_change();