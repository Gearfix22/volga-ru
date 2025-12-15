-- Add 'driver' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';

-- Create a function to check if a user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Update the assign_default_role function to handle driver role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_specified_role text;
BEGIN
  -- Get role from metadata if provided
  user_specified_role := NEW.raw_user_meta_data->>'role';
  
  -- Assign default role if none exists
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    -- If role specified in metadata and valid, use it; otherwise use 'user'
    IF user_specified_role IN ('admin', 'moderator', 'user', 'driver') THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, user_specified_role::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;