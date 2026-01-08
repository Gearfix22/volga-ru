-- CRITICAL SECURITY FIX: Enable RLS on bookings and services tables
-- These tables have policies but RLS was disabled

-- Enable RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on services table  
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for services table (admin manage, public read active)
CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all services" 
ON public.services 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add customer read policy for booking_prices
CREATE POLICY "Customers can view own booking prices" 
ON public.booking_prices 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND b.user_id = auth.uid()
  )
);

-- Add guide permissions to bookings
CREATE POLICY "Guides can view bookings assigned to them" 
ON public.bookings 
FOR SELECT 
USING (
  assigned_guide_id = auth.uid() 
  AND has_role(auth.uid(), 'guide'::app_role)
);