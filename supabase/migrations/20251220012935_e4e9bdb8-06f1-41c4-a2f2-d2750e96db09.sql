-- Set replica identity to FULL for driver_locations table
-- This ensures all column data is available in realtime updates
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;

-- Also ensure bookings table has FULL replica identity for status updates
ALTER TABLE public.bookings REPLICA IDENTITY FULL;