-- Add UNIQUE constraint on profiles.phone for phone uniqueness enforcement
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Create index for faster phone lookups during signup validation
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);