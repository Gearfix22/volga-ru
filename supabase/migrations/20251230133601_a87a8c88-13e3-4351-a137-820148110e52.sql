-- Add DELETE policy for admin on bookings (currently missing)
CREATE POLICY "Admins can delete bookings" 
ON public.bookings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure admin can update all booking fields including price
-- (Policy exists but confirming it covers all columns - UPDATE policy already exists)

-- Add INSERT policy for admin on bookings (for manual booking creation)
CREATE POLICY "Admins can insert bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));