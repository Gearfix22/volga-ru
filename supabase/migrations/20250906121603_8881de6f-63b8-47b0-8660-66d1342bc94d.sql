-- Fix critical security vulnerability: Secure booking detail tables
-- These tables contain sensitive customer travel information and must be protected

-- Enable RLS on all booking detail tables
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_trip_bookings ENABLE ROW LEVEL SECURITY;

-- Hotel bookings policies
-- Users can only view their own hotel booking details
CREATE POLICY "Users can view own hotel bookings" 
ON public.hotel_bookings 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Users can insert hotel booking details for their own bookings
CREATE POLICY "Users can insert own hotel bookings" 
ON public.hotel_bookings 
FOR INSERT 
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Admins can view all hotel bookings
CREATE POLICY "Admins can view all hotel bookings" 
ON public.hotel_bookings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Transportation bookings policies
-- Users can only view their own transportation booking details
CREATE POLICY "Users can view own transportation bookings" 
ON public.transportation_bookings 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Users can insert transportation booking details for their own bookings
CREATE POLICY "Users can insert own transportation bookings" 
ON public.transportation_bookings 
FOR INSERT 
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Admins can view all transportation bookings
CREATE POLICY "Admins can view all transportation bookings" 
ON public.transportation_bookings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Event bookings policies
-- Users can only view their own event booking details
CREATE POLICY "Users can view own event bookings" 
ON public.event_bookings 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Users can insert event booking details for their own bookings
CREATE POLICY "Users can insert own event bookings" 
ON public.event_bookings 
FOR INSERT 
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Admins can view all event bookings
CREATE POLICY "Admins can view all event bookings" 
ON public.event_bookings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Custom trip bookings policies
-- Users can only view their own custom trip booking details
CREATE POLICY "Users can view own custom trip bookings" 
ON public.custom_trip_bookings 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Users can insert custom trip booking details for their own bookings
CREATE POLICY "Users can insert own custom trip bookings" 
ON public.custom_trip_bookings 
FOR INSERT 
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

-- Admins can view all custom trip bookings
CREATE POLICY "Admins can view all custom trip bookings" 
ON public.custom_trip_bookings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));