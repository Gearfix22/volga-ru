
-- Add new columns to existing tables for enhanced booking functionality

-- Add passengers column to transportation_bookings
ALTER TABLE public.transportation_bookings 
ADD COLUMN IF NOT EXISTS passengers TEXT DEFAULT '1';

-- Add guests and special_requests columns to hotel_bookings
ALTER TABLE public.hotel_bookings 
ADD COLUMN IF NOT EXISTS guests TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Add ticket_type column to event_bookings
ALTER TABLE public.event_bookings 
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'general';

-- Add budget_range and additional_info columns to custom_trip_bookings
ALTER TABLE public.custom_trip_bookings 
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Update the bookings table to add some useful indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON public.bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_transaction_id ON public.bookings(transaction_id);

-- Add comments for better documentation
COMMENT ON COLUMN public.transportation_bookings.passengers IS 'Number of passengers for the transportation service';
COMMENT ON COLUMN public.hotel_bookings.guests IS 'Number of guests for the hotel reservation';
COMMENT ON COLUMN public.hotel_bookings.special_requests IS 'Special requests or preferences for the hotel stay';
COMMENT ON COLUMN public.event_bookings.ticket_type IS 'Type of event ticket (general, vip, premium, backstage)';
COMMENT ON COLUMN public.custom_trip_bookings.budget_range IS 'Budget range for the custom trip';
COMMENT ON COLUMN public.custom_trip_bookings.additional_info IS 'Additional information or special requirements for the trip';
