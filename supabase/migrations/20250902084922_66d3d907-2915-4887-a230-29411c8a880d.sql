-- Fix critical security vulnerability: Secure profiles table with user PII
-- Enable RLS on profiles table to protect user personal information
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile only
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile only
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own profile (needed for signup trigger)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles for management purposes
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update profiles for moderation purposes
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Update the handle_new_user function to ensure it works with RLS
-- The function needs to be SECURITY DEFINER to bypass RLS during user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_verified, phone, full_name)
  VALUES (
    new.id, 
    CASE 
      WHEN new.phone_confirmed_at IS NOT NULL THEN true
      ELSE false
    END,
    COALESCE(new.raw_user_meta_data ->> 'phone', new.phone),
    new.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    phone_verified = CASE 
      WHEN new.phone_confirmed_at IS NOT NULL THEN true
      ELSE false
    END,
    phone = COALESCE(new.raw_user_meta_data ->> 'phone', new.phone),
    full_name = new.raw_user_meta_data ->> 'full_name';
  RETURN new;
END;
$$;

-- Ensure the trigger exists for automatic profile creation
CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();