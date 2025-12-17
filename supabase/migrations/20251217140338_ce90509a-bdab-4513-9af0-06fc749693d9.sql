-- Create driver_notifications table for instant notifications to drivers
CREATE TABLE public.driver_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own notifications
CREATE POLICY "Drivers can view own notifications" 
ON public.driver_notifications 
FOR SELECT 
USING (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role));

-- Drivers can update their own notifications (mark as read)
CREATE POLICY "Drivers can update own notifications" 
ON public.driver_notifications 
FOR UPDATE 
USING (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role));

-- System can insert notifications (for triggers)
CREATE POLICY "System can insert driver notifications" 
ON public.driver_notifications 
FOR INSERT 
WITH CHECK (true);

-- Admins can manage all driver notifications
CREATE POLICY "Admins can manage driver notifications" 
ON public.driver_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_driver_notifications_driver_id ON public.driver_notifications(driver_id);
CREATE INDEX idx_driver_notifications_is_read ON public.driver_notifications(driver_id, is_read);

-- Create function to notify driver when assigned to booking
CREATE OR REPLACE FUNCTION public.notify_driver_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when assigned_driver_id changes from NULL to a value or changes to a different driver
  IF (TG_OP = 'UPDATE' AND NEW.assigned_driver_id IS NOT NULL AND 
      (OLD.assigned_driver_id IS NULL OR OLD.assigned_driver_id != NEW.assigned_driver_id)) THEN
    
    INSERT INTO public.driver_notifications (
      driver_id,
      booking_id,
      type,
      title,
      message
    ) VALUES (
      NEW.assigned_driver_id,
      NEW.id,
      'new_assignment',
      'New Trip Assignment',
      'You have been assigned a new ' || NEW.service_type || ' booking. Please review the details.'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for driver assignment notifications
CREATE TRIGGER on_driver_assigned
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_on_assignment();

-- Enable realtime for bookings (for drivers to see updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_notifications;

-- Set REPLICA IDENTITY for realtime
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.driver_notifications REPLICA IDENTITY FULL;