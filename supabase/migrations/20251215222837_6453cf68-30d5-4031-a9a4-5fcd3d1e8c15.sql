-- Add RLS policies to service tables (public read, admin write)

-- hotel_services: public can read, admin can manage
CREATE POLICY "Anyone can view hotel services"
ON public.hotel_services
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage hotel services"
ON public.hotel_services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- transportation_services: public can read, admin can manage
CREATE POLICY "Anyone can view transportation services"
ON public.transportation_services
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage transportation services"
ON public.transportation_services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- event_services: public can read, admin can manage
CREATE POLICY "Anyone can view event services"
ON public.event_services
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage event services"
ON public.event_services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- custom_trip_packages: public can read, admin can manage
CREATE POLICY "Anyone can view custom trip packages"
ON public.custom_trip_packages
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage custom trip packages"
ON public.custom_trip_packages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- service_categories: public can read, admin can manage
CREATE POLICY "Anyone can view service categories"
ON public.service_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage service categories"
ON public.service_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- services: public can read, admin can manage
CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.update_draft_booking_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;