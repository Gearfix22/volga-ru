-- Add driver_required field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS driver_required boolean DEFAULT false;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_bookings_driver_required ON public.bookings(driver_required) WHERE driver_required = true;