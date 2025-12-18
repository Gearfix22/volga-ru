-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Drivers can upsert own location" ON public.driver_locations;
DROP POLICY IF EXISTS "Admins can manage driver locations" ON public.driver_locations;
DROP POLICY IF EXISTS "Admins can view all driver locations" ON public.driver_locations;
DROP POLICY IF EXISTS "Customers can view assigned driver location for active bookings" ON public.driver_locations;

-- Create PERMISSIVE policies (default behavior, any matching policy grants access)
CREATE POLICY "Drivers can upsert own location"
ON public.driver_locations
FOR ALL
TO authenticated
USING (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role))
WITH CHECK (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role));

CREATE POLICY "Admins can manage all driver locations"
ON public.driver_locations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view driver location for active bookings"
ON public.driver_locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = driver_locations.booking_id
    AND b.user_id = auth.uid()
    AND b.assigned_driver_id = driver_locations.driver_id
    AND b.status IN ('confirmed', 'accepted', 'on_the_way')
    AND b.show_driver_to_customer = true
  )
);

-- Also fix any driver.id mismatches by syncing with auth user
-- This ensures driver.id matches the auth.uid for RLS to work correctly