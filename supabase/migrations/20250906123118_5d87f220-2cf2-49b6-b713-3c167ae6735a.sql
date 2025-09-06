-- Enhance booking system for complete flow with auto-save and status tracking

-- Create draft_bookings table for saving progress
CREATE TABLE public.draft_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_details JSONB DEFAULT '{}',
  user_info JSONB DEFAULT '{}',
  booking_progress TEXT DEFAULT 'service_selection', -- service_selection, details_filled, user_info_filled, ready_for_payment
  total_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.draft_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for draft_bookings
CREATE POLICY "Users can manage own draft bookings" 
ON public.draft_bookings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create booking_status_history table for tracking status changes
CREATE TABLE public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking status history
CREATE POLICY "Users can view own booking status history" 
ON public.booking_status_history 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all booking status history" 
ON public.booking_status_history 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add status update trigger for bookings
CREATE OR REPLACE FUNCTION public.track_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER booking_status_change_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.track_booking_status_change();

-- Create function to update draft booking timestamps
CREATE OR REPLACE FUNCTION public.update_draft_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for draft bookings
CREATE TRIGGER update_draft_bookings_updated_at
  BEFORE UPDATE ON public.draft_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_draft_booking_timestamp();

-- Add payment receipt storage for bank transfers
CREATE TABLE public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment receipts
CREATE POLICY "Users can manage own payment receipts" 
ON public.payment_receipts 
FOR ALL 
USING (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all payment receipts" 
ON public.payment_receipts 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update bookings table to support more payment methods and status
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT;