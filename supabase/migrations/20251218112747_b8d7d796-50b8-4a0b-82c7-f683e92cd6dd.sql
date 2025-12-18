-- Add admin delete permission for profiles table
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update driver_locations RLS to allow on_trip status
DROP POLICY IF EXISTS "Customers can view driver location for active bookings" ON public.driver_locations;
CREATE POLICY "Customers can view driver location for active bookings"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = driver_locations.booking_id 
    AND b.user_id = auth.uid() 
    AND b.assigned_driver_id = driver_locations.driver_id 
    AND b.status IN ('assigned', 'accepted', 'on_trip')
    AND b.show_driver_to_customer = true
  )
);