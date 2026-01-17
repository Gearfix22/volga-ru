-- Drop the outdated check constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS valid_status;

-- Add the correct check constraint with all valid booking statuses
ALTER TABLE public.bookings ADD CONSTRAINT valid_status CHECK (
  status = ANY (ARRAY[
    'draft'::text,
    'pending'::text,
    'under_review'::text,
    'approved'::text,
    'awaiting_payment'::text,
    'paid'::text,
    'confirmed'::text,
    'assigned'::text,
    'accepted'::text,
    'on_trip'::text,
    'completed'::text,
    'cancelled'::text,
    'rejected'::text
  ])
);