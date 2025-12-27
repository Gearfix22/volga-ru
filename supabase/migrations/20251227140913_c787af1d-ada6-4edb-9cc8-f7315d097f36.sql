-- Create tourist_guide_bookings table for guide-specific booking details
CREATE TABLE public.tourist_guide_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  guide_language text NOT NULL DEFAULT 'English',
  tour_area text NOT NULL,
  tour_date date NOT NULL,
  tour_start_time time NOT NULL,
  tour_duration_hours integer NOT NULL DEFAULT 2,
  special_interests text,
  group_size integer DEFAULT 1,
  hourly_rate numeric DEFAULT 50,
  created_at timestamp with time zone DEFAULT now()
);

-- Create guides table (similar to drivers)
CREATE TABLE public.guides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  languages text[] DEFAULT ARRAY['English'],
  specialization text[] DEFAULT ARRAY['City Tours'],
  hourly_rate numeric DEFAULT 50,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create guide_notifications table
CREATE TABLE public.guide_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id uuid NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create guide_locations table for tracking
CREATE TABLE public.guide_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id uuid NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  speed double precision,
  accuracy double precision,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_guide_location UNIQUE (guide_id)
);

-- Add assigned_guide_id to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_guide_id uuid REFERENCES public.guides(id);

-- Add customer_proposed_price and price_confirmed columns for price negotiation
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_proposed_price numeric;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS price_confirmed boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS price_confirmed_at timestamp with time zone;

-- Add more fields to services table for full management
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS features text[];
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.service_categories(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Enable RLS on new tables
ALTER TABLE public.tourist_guide_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for tourist_guide_bookings
CREATE POLICY "Users can view own guide bookings" ON public.tourist_guide_bookings
  FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own guide bookings" ON public.tourist_guide_bookings
  FOR INSERT WITH CHECK (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all guide bookings" ON public.tourist_guide_bookings
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all guide bookings" ON public.tourist_guide_bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for guides
CREATE POLICY "Admins can manage guides" ON public.guides
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Guides can view own record" ON public.guides
  FOR SELECT USING (id = auth.uid() AND has_role(auth.uid(), 'guide'));

-- RLS policies for guide_notifications
CREATE POLICY "Guides can view own notifications" ON public.guide_notifications
  FOR SELECT USING (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'));

CREATE POLICY "Guides can update own notifications" ON public.guide_notifications
  FOR UPDATE USING (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'));

CREATE POLICY "System can insert guide notifications" ON public.guide_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage guide notifications" ON public.guide_notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS policies for guide_locations
CREATE POLICY "Guides can manage own location" ON public.guide_locations
  FOR ALL USING (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'))
  WITH CHECK (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'));

CREATE POLICY "Admins can manage all guide locations" ON public.guide_locations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view guide location for active bookings" ON public.guide_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = guide_locations.booking_id
      AND b.user_id = auth.uid()
      AND b.assigned_guide_id = guide_locations.guide_id
      AND b.status IN ('assigned', 'accepted', 'on_trip')
      AND b.show_driver_to_customer = true
    )
  );

-- Create trigger to notify guides on assignment
CREATE OR REPLACE FUNCTION public.notify_guide_on_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.assigned_guide_id IS NOT NULL AND 
      (OLD.assigned_guide_id IS NULL OR OLD.assigned_guide_id != NEW.assigned_guide_id)) THEN
    
    INSERT INTO public.guide_notifications (
      guide_id,
      booking_id,
      type,
      title,
      message
    ) VALUES (
      NEW.assigned_guide_id,
      NEW.id,
      'new_assignment',
      'New Tour Assignment',
      'You have been assigned a new tourist guide booking. Please review the details.'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_guide_assignment
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_guide_on_assignment();

-- Insert default Guide service
INSERT INTO public.services (name, type, description, base_price, is_active, display_order)
VALUES ('Private Tourist Guide', 'Guide', 'Professional tourist guide services with local expertise', 50, true, 4)
ON CONFLICT DO NOTHING;