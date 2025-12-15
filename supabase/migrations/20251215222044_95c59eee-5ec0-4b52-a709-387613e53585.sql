-- Allow drivers to view and update their assigned bookings
CREATE POLICY "Drivers can view assigned bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (assigned_driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can update assigned bookings status"
ON public.bookings
FOR UPDATE
TO authenticated
USING (assigned_driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'))
WITH CHECK (assigned_driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));

-- Allow drivers to view their own driver record
CREATE POLICY "Drivers can view own driver record"
ON public.drivers
FOR SELECT
TO authenticated
USING (id = auth.uid() AND public.has_role(auth.uid(), 'driver'));