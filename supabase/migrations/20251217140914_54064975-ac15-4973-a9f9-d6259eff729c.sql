-- Add driver response and visibility columns to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS driver_response TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS show_driver_to_customer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS driver_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS driver_notes TEXT;

-- Create function to notify customer when driver accepts/updates
CREATE OR REPLACE FUNCTION public.notify_customer_on_driver_update()
RETURNS TRIGGER AS $$
BEGIN
  -- When driver accepts/rejects or updates status
  IF (TG_OP = 'UPDATE' AND NEW.driver_response IS DISTINCT FROM OLD.driver_response) THEN
    -- Create notification for the booking owner
    INSERT INTO public.notifications (
      type,
      message,
      booking_id,
      target_admin_id
    ) VALUES (
      'driver_response',
      CASE 
        WHEN NEW.driver_response = 'accepted' THEN 'Your driver has accepted the booking'
        WHEN NEW.driver_response = 'rejected' THEN 'Driver declined - reassigning your booking'
        ELSE 'Driver status updated'
      END,
      NEW.id,
      NULL
    );
  END IF;
  
  -- When status changes to on_the_way or completed
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('on_the_way', 'completed')) THEN
    INSERT INTO public.notifications (
      type,
      message,
      booking_id,
      target_admin_id
    ) VALUES (
      'booking_status_update',
      CASE 
        WHEN NEW.status = 'on_the_way' THEN 'Your driver is on the way!'
        WHEN NEW.status = 'completed' THEN 'Your trip has been completed'
        ELSE 'Booking status updated to ' || NEW.status
      END,
      NEW.id,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for customer notifications
DROP TRIGGER IF EXISTS on_driver_update_notify_customer ON public.bookings;
CREATE TRIGGER on_driver_update_notify_customer
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_on_driver_update();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_driver_response ON public.bookings(driver_response);
CREATE INDEX IF NOT EXISTS idx_bookings_show_driver ON public.bookings(show_driver_to_customer);