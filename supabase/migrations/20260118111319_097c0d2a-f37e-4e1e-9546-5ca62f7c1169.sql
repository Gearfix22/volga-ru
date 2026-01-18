
-- FIX: Remove duplicate trigger that causes double status history entries
-- There are two triggers doing the same thing:
--   1. booking_status_change_trigger -> track_booking_status_change()
--   2. trg_booking_status -> log_booking_status()
-- We'll keep booking_status_change_trigger and remove the duplicate

-- Drop the duplicate trigger
DROP TRIGGER IF EXISTS trg_booking_status ON public.bookings;

-- Also drop the duplicate function if not used elsewhere
DROP FUNCTION IF EXISTS public.log_booking_status();

-- Clean up existing duplicate entries in booking_status_history
-- Keep only the first entry for each (booking_id, old_status, new_status, created_at) group
DELETE FROM public.booking_status_history a
USING public.booking_status_history b
WHERE a.id > b.id
  AND a.booking_id = b.booking_id
  AND a.old_status IS NOT DISTINCT FROM b.old_status
  AND a.new_status = b.new_status
  AND a.created_at = b.created_at;

-- Verify the remaining trigger is correct
COMMENT ON TRIGGER booking_status_change_trigger ON public.bookings IS 
'Single trigger for logging booking status changes to booking_status_history';
