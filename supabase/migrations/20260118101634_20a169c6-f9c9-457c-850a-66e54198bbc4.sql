-- Update notify_customer_booking_update to use unified_notifications
CREATE OR REPLACE FUNCTION public.notify_customer_booking_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger for user bookings with status changes
  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.unified_notifications (
      recipient_type,
      recipient_id,
      booking_id,
      type,
      title,
      message
    )
    VALUES (
      'user',
      NEW.user_id,
      NEW.id,
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'booking_update'
        WHEN NEW.status = 'assigned' THEN 'driver_assigned'
        WHEN NEW.status = 'on_trip' THEN 'driver_arrival'
        WHEN NEW.status = 'completed' THEN 'trip_complete'
        ELSE 'booking_update'
      END,
      CASE
        WHEN NEW.status = 'confirmed' THEN 'Booking Confirmed'
        WHEN NEW.status = 'assigned' THEN 'Driver Assigned'
        WHEN NEW.status = 'accepted' THEN 'Driver Accepted'
        WHEN NEW.status = 'on_trip' THEN 'Trip Started'
        WHEN NEW.status = 'completed' THEN 'Trip Completed'
        WHEN NEW.status = 'cancelled' THEN 'Booking Cancelled'
        ELSE 'Booking Updated'
      END,
      CASE
        WHEN NEW.status = 'confirmed' THEN 'Your booking has been confirmed by our team.'
        WHEN NEW.status = 'assigned' THEN 'A driver has been assigned to your booking.'
        WHEN NEW.status = 'accepted' THEN 'Your driver has accepted the trip.'
        WHEN NEW.status = 'on_trip' THEN 'Your trip has started. Track your driver in real-time.'
        WHEN NEW.status = 'completed' THEN 'Your trip has been completed. Thank you for choosing us!'
        WHEN NEW.status = 'cancelled' THEN 'Your booking has been cancelled.'
        ELSE 'Your booking status has been updated to ' || NEW.status
      END
    );
  END IF;
  
  -- Notify on payment status change
  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT NULL AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    IF NEW.payment_status = 'paid' THEN
      INSERT INTO public.unified_notifications (
        recipient_type,
        recipient_id,
        booking_id,
        type,
        title,
        message
      )
      VALUES (
        'user',
        NEW.user_id,
        NEW.id,
        'payment',
        'Payment Confirmed',
        'Your payment has been confirmed. Thank you!'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;