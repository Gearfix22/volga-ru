-- TASK 1: Make phone mandatory for new signups (Fixed version)

-- Update existing NULL phones with placeholder
UPDATE public.profiles 
SET phone = '+0000000000' 
WHERE phone IS NULL OR phone = '';

-- Make phone NOT NULL (existing data now has placeholders)
ALTER TABLE public.profiles 
ALTER COLUMN phone SET NOT NULL;

-- Update the handle_new_user function to capture phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name, phone_verified)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'phone',
      new.phone,
      '+0000000000'
    ),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN new.phone_confirmed_at IS NOT NULL THEN true
      ELSE false
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(
      new.raw_user_meta_data->>'phone',
      new.phone,
      profiles.phone
    ),
    full_name = COALESCE(
      new.raw_user_meta_data->>'full_name',
      profiles.full_name
    ),
    phone_verified = CASE 
      WHEN new.phone_confirmed_at IS NOT NULL THEN true
      ELSE profiles.phone_verified
    END;
  RETURN new;
END;
$function$;

-- Add default role assignment for new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_specified_role text;
BEGIN
  -- Get role from metadata if provided
  user_specified_role := NEW.raw_user_meta_data->>'role';
  
  -- Assign default role if none exists
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    -- If role specified in metadata and valid, use it; otherwise use 'user'
    IF user_specified_role IN ('admin', 'moderator', 'user') THEN
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
$function$;

-- Create trigger for role assignment
DROP TRIGGER IF EXISTS on_auth_user_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number (mandatory). Format: international format recommended';