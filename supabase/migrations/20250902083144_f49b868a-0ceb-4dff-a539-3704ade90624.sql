-- Update the handle_new_user function to save phone number from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$