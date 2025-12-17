-- Create driver_locations table for real-time location tracking
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id)
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Admin can view all driver locations
CREATE POLICY "Admins can view all driver locations"
ON public.driver_locations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can manage driver locations
CREATE POLICY "Admins can manage driver locations"
ON public.driver_locations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drivers can update their own location
CREATE POLICY "Drivers can upsert own location"
ON public.driver_locations
FOR ALL
USING (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role))
WITH CHECK (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role));

-- Customers can view driver location only for their confirmed/active bookings with assigned driver
CREATE POLICY "Customers can view assigned driver location for active bookings"
ON public.driver_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = driver_locations.booking_id
    AND b.user_id = auth.uid()
    AND b.assigned_driver_id = driver_locations.driver_id
    AND b.status IN ('confirmed', 'accepted', 'on_the_way')
    AND b.show_driver_to_customer = true
  )
);

-- Create index for faster lookups
CREATE INDEX idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_locations_booking_id ON public.driver_locations(booking_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;