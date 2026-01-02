-- Enable RLS on tables that don't have it
ALTER TABLE public.custom_trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_guide_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportation_bookings ENABLE ROW LEVEL SECURITY;