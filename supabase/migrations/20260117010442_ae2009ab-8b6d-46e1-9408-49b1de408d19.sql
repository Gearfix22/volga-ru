-- Drop the obsolete trigger that references non-existent 'notifications' table
DROP TRIGGER IF EXISTS notify_admins_on_new_booking ON public.bookings;

-- Update the function to use unified_notifications instead
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create notification for all admins using unified_notifications
  INSERT INTO public.unified_notifications (
    recipient_type,
    recipient_id,
    type,
    title,
    message,
    booking_id
  )
  VALUES (
    'admin',
    '00000000-0000-0000-0000-000000000000', -- Placeholder for all admins
    'new_booking',
    'New Booking Request',
    'New ' || NEW.service_type || ' booking received - ID: ' || LEFT(NEW.id::text, 8),
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER notify_admins_on_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_booking();