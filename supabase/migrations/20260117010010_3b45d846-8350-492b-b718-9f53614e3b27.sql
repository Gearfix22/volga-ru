-- Drop the trigger first with CASCADE
DROP TRIGGER IF EXISTS trg_snapshot_booking_price ON public.bookings;

-- Now drop the function
DROP FUNCTION IF EXISTS public.snapshot_booking_price() CASCADE;