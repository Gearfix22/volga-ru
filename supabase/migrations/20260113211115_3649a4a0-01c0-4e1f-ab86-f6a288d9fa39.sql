-- =====================================================
-- DYNAMIC SERVICES SYSTEM - COMPLETE SOLUTION
-- =====================================================

-- 1. Add missing 'currency' column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

-- 2. Add 'service_id' reference to bookings table for proper FK relationship
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id);

-- 3. Add price snapshot columns to bookings (captures price at booking time)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS quoted_price_snapshot numeric,
ADD COLUMN IF NOT EXISTS currency_snapshot text;

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_services_type ON public.services(type);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- 5. Update existing services with USD currency
UPDATE public.services SET currency = 'USD' WHERE currency IS NULL OR currency = '';

-- 6. Create RLS policies for services table (if not exists)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

-- Public can view active services
CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all services
CREATE POLICY "Admins can manage services" 
ON public.services 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- 7. Create function to get service by type (for backward compatibility)
CREATE OR REPLACE FUNCTION public.get_service_by_type(p_type text)
RETURNS TABLE(
  id uuid,
  name text,
  type text,
  description text,
  base_price numeric,
  currency text,
  image_url text,
  features text[],
  is_active boolean
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.name,
    s.type,
    s.description,
    s.base_price,
    s.currency,
    s.image_url,
    s.features,
    s.is_active
  FROM services s
  WHERE s.type = p_type 
    AND s.is_active = true
  ORDER BY s.display_order ASC
  LIMIT 1;
$$;

-- 8. Create function to snapshot price at booking creation
CREATE OR REPLACE FUNCTION public.snapshot_booking_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If service_id is provided, snapshot the price
  IF NEW.service_id IS NOT NULL THEN
    SELECT base_price, currency 
    INTO NEW.quoted_price_snapshot, NEW.currency_snapshot
    FROM services 
    WHERE id = NEW.service_id;
  END IF;
  
  -- If service_type is provided but no service_id, try to find matching service
  IF NEW.service_id IS NULL AND NEW.service_type IS NOT NULL THEN
    SELECT id, base_price, currency 
    INTO NEW.service_id, NEW.quoted_price_snapshot, NEW.currency_snapshot
    FROM services 
    WHERE type = NEW.service_type 
      AND is_active = true
    ORDER BY display_order ASC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trg_snapshot_booking_price ON public.bookings;
CREATE TRIGGER trg_snapshot_booking_price
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_booking_price();

-- 9. Add comment for documentation
COMMENT ON TABLE public.services IS 'Single source of truth for all bookable services. Admin-managed, dynamically fetched by frontend.';
COMMENT ON COLUMN public.services.currency IS 'Currency for base_price (USD, EUR, RUB, SAR, EGP)';
COMMENT ON COLUMN public.bookings.service_id IS 'Reference to services table for proper FK relationship';
COMMENT ON COLUMN public.bookings.quoted_price_snapshot IS 'Price snapshot at booking creation time';
COMMENT ON COLUMN public.bookings.currency_snapshot IS 'Currency snapshot at booking creation time';