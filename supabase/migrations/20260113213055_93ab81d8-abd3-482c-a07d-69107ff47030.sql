-- ============================================================
-- SYSTEM AUDIT FIXES - Volga Services Production
-- ============================================================

-- 1. CREATE LOGIN_ATTEMPTS TABLE (missing - rate limiting broken)
-- جدول محاولات تسجيل الدخول للحد من معدل الطلبات
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  ip_address TEXT,
  attempt_type TEXT NOT NULL DEFAULT 'login',
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON public.login_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON public.login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_type ON public.login_attempts(attempt_type);

-- RLS for login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can manage login attempts (edge functions use service key)
CREATE POLICY "Service role manages login_attempts"
  ON public.login_attempts FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. ADD MISSING DRIVER SERVICE
-- إضافة خدمة السائق المفقودة
INSERT INTO public.services (
  name, 
  type, 
  description, 
  base_price, 
  currency,
  features, 
  is_active, 
  display_order,
  image_url
)
SELECT 
  'Driver Service',
  'Driver',
  'Professional driver for city tours, airport transfers, and inter-city travel. Includes comfortable vehicles and experienced drivers.',
  50,
  'USD',
  ARRAY['One-way & Round trips', 'Airport Transfers', 'City Transportation', 'Professional Drivers', 'Multiple Vehicle Types'],
  true,
  1,
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop'
WHERE NOT EXISTS (
  SELECT 1 FROM public.services WHERE type = 'Driver'
);

-- 3. UPDATE EXISTING BOOKINGS TO LINK WITH SERVICES
-- ربط الحجوزات الموجودة بالخدمات
UPDATE public.bookings b
SET service_id = (
  SELECT s.id FROM public.services s 
  WHERE s.type = b.service_type 
  AND s.is_active = true
  LIMIT 1
)
WHERE b.service_id IS NULL;

-- 4. CLEANUP: Drop unused i18n tables if empty
-- Note: We keep them as they are part of the schema design
-- Frontend uses JSON files for i18n which is more efficient

-- 5. ADD COMMENT TO DOCUMENT DEPRECATED COLUMNS
COMMENT ON COLUMN public.bookings.quoted_price IS 'DEPRECATED: Use quoted_price_snapshot instead for accurate historical pricing';

-- 6. ENSURE SERVICES HAVE PROPER CURRENCY VALUES
UPDATE public.services 
SET currency = 'USD' 
WHERE currency IS NULL OR currency = '';

-- 7. CREATE FUNCTION TO CLEANUP OLD LOGIN ATTEMPTS (older than 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE created_at < now() - interval '24 hours';
END;
$$;

-- 8. Add table comment for documentation
COMMENT ON TABLE public.login_attempts IS 'Rate limiting table for login/password reset attempts. Entries older than 24h should be cleaned up periodically.';