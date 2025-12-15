-- Create table to track failed login attempts for rate limiting
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or phone used for login
  ip_address TEXT, -- optional IP tracking
  attempt_type TEXT NOT NULL, -- 'admin', 'driver', 'user'
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for quick lookups
CREATE INDEX idx_login_attempts_identifier_time ON public.login_attempts (identifier, created_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts (ip_address, created_at DESC);

-- Enable RLS (only edge functions with service role can access)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access via edge functions
-- This table is internal security infrastructure

-- Auto-cleanup old attempts (older than 24 hours)
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