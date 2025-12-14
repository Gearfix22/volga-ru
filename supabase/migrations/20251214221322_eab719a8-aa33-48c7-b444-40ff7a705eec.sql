-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view all drivers"
ON public.drivers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert drivers"
ON public.drivers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update drivers"
ON public.drivers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete drivers"
ON public.drivers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add driver assignment to bookings
ALTER TABLE public.bookings ADD COLUMN assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_bookings_driver ON public.bookings(assigned_driver_id);

-- Trigger for updated_at
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_draft_booking_timestamp();