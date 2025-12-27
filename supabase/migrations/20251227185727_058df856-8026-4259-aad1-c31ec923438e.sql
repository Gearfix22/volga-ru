-- Guide can view assigned bookings
CREATE POLICY "Guides can view assigned bookings"
ON public.bookings
FOR SELECT
USING (
  assigned_guide_id = auth.uid() 
  AND has_role(auth.uid(), 'guide'::app_role)
);

-- Guide can update ONLY status on assigned bookings (not price/payment fields)
CREATE POLICY "Guides can update assigned booking status"
ON public.bookings
FOR UPDATE
USING (
  assigned_guide_id = auth.uid() 
  AND has_role(auth.uid(), 'guide'::app_role)
)
WITH CHECK (
  assigned_guide_id = auth.uid() 
  AND has_role(auth.uid(), 'guide'::app_role)
);

-- Guide can update own profile in guides table
CREATE POLICY "Guides can update own record"
ON public.guides
FOR UPDATE
USING (
  id = auth.uid() 
  AND has_role(auth.uid(), 'guide'::app_role)
)
WITH CHECK (
  id = auth.uid() 
  AND has_role(auth.uid(), 'guide'::app_role)
);

-- Create function to log guide actions
CREATE OR REPLACE FUNCTION public.log_guide_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if updated by a guide
  IF has_role(auth.uid(), 'guide'::app_role) THEN
    INSERT INTO public.admin_logs (admin_id, action_type, target_id, target_table, payload)
    VALUES (
      auth.uid(),
      'guide_booking_update',
      NEW.id,
      'bookings',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'guide_id', NEW.assigned_guide_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for logging guide actions
CREATE TRIGGER log_guide_booking_changes
AFTER UPDATE ON public.bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_guide_booking_update();