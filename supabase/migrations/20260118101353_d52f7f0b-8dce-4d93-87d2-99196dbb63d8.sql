-- Update notify_on_booking_status_change to use unified_notifications
CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
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
      '00000000-0000-0000-0000-000000000000',
      'status_change',
      'Booking Status Changed',
      'Booking ' || LEFT(NEW.id::text, 8) || ' status changed to ' || NEW.status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_customer_on_driver_update to use unified_notifications
CREATE OR REPLACE FUNCTION public.notify_customer_on_driver_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When driver accepts/rejects or updates status
  IF (TG_OP = 'UPDATE' AND NEW.driver_response IS DISTINCT FROM OLD.driver_response AND NEW.user_id IS NOT NULL) THEN
    INSERT INTO public.unified_notifications (
      recipient_type,
      recipient_id,
      type,
      title,
      message,
      booking_id
    ) VALUES (
      'user',
      NEW.user_id,
      'driver_response',
      CASE 
        WHEN NEW.driver_response = 'accepted' THEN 'Driver Accepted'
        WHEN NEW.driver_response = 'rejected' THEN 'Driver Reassigning'
        ELSE 'Driver Update'
      END,
      CASE 
        WHEN NEW.driver_response = 'accepted' THEN 'Your driver has accepted the booking'
        WHEN NEW.driver_response = 'rejected' THEN 'Driver declined - reassigning your booking'
        ELSE 'Driver status updated'
      END,
      NEW.id
    );
  END IF;
  
  -- When status changes to on_trip or completed
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('on_trip', 'completed') AND NEW.user_id IS NOT NULL) THEN
    INSERT INTO public.unified_notifications (
      recipient_type,
      recipient_id,
      type,
      title,
      message,
      booking_id
    ) VALUES (
      'user',
      NEW.user_id,
      'booking_status_update',
      CASE 
        WHEN NEW.status = 'on_trip' THEN 'Driver En Route'
        WHEN NEW.status = 'completed' THEN 'Trip Completed'
        ELSE 'Booking Updated'
      END,
      CASE 
        WHEN NEW.status = 'on_trip' THEN 'Your driver is on the way!'
        WHEN NEW.status = 'completed' THEN 'Your trip has been completed'
        ELSE 'Booking status updated to ' || NEW.status
      END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;