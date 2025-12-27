-- Create guide_availability table
CREATE TABLE public.guide_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL UNIQUE,
  is_available boolean DEFAULT true,
  available_from time DEFAULT '09:00',
  available_to time DEFAULT '18:00',
  working_days integer[] DEFAULT ARRAY[1,2,3,4,5],
  languages text[] DEFAULT ARRAY['English'],
  service_areas text[] DEFAULT ARRAY['City Center'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guide_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Guides can view own availability"
ON public.guide_availability FOR SELECT
USING (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'::app_role));

CREATE POLICY "Guides can manage own availability"
ON public.guide_availability FOR ALL
USING (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'::app_role))
WITH CHECK (guide_id = auth.uid() AND has_role(auth.uid(), 'guide'::app_role));

CREATE POLICY "Admins can manage all availability"
ON public.guide_availability FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view availability for matching (needed for booking flow)
CREATE POLICY "Anyone can view active guide availability"
ON public.guide_availability FOR SELECT
USING (is_available = true);