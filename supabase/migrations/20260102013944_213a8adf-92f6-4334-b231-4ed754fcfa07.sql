-- Add RLS policies for guide_locations if they don't exist
DROP POLICY IF EXISTS "Admins can manage all guide locations" ON public.guide_locations;
DROP POLICY IF EXISTS "Customers can view guide location for active bookings" ON public.guide_locations;
DROP POLICY IF EXISTS "Guides can manage own location" ON public.guide_locations;

CREATE POLICY "Admins can manage all guide locations" 
ON public.guide_locations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view guide location for active bookings" 
ON public.guide_locations 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM bookings b 
  WHERE b.id = guide_locations.booking_id 
  AND b.user_id = auth.uid() 
  AND b.assigned_guide_id = guide_locations.guide_id 
  AND b.status = ANY (ARRAY['assigned'::text, 'accepted'::text, 'on_trip'::text]) 
  AND b.show_driver_to_customer = true
));

CREATE POLICY "Guides can manage own location" 
ON public.guide_locations 
FOR ALL 
USING (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'::app_role))
WITH CHECK (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'::app_role));