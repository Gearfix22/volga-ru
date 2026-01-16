-- Add multilingual columns to services table for i18n support
-- This enables storing translations for service names and descriptions

-- Add name translations
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- Add description translations
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT;

-- Add service status enum-like column for draft/active/hidden support
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'hidden'));

-- Migrate existing data: copy current name/description to English columns
UPDATE public.services 
SET 
  name_en = name,
  description_en = description
WHERE name_en IS NULL;

-- Create index for faster language-based queries
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_services_type_active ON public.services(type, is_active);

-- Add comment for documentation
COMMENT ON COLUMN public.services.name_en IS 'Service name in English';
COMMENT ON COLUMN public.services.name_ar IS 'Service name in Arabic';
COMMENT ON COLUMN public.services.name_ru IS 'Service name in Russian';
COMMENT ON COLUMN public.services.description_en IS 'Service description in English';
COMMENT ON COLUMN public.services.description_ar IS 'Service description in Arabic';
COMMENT ON COLUMN public.services.description_ru IS 'Service description in Russian';
COMMENT ON COLUMN public.services.status IS 'Service visibility status: draft, active, or hidden';