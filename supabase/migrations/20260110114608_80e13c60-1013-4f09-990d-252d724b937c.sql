-- Fix mutable search_path warnings on database functions
-- Adding SET search_path = public to all functions that are missing it

-- 1. Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$function$;

-- 2. Fix is_driver function
CREATE OR REPLACE FUNCTION public.is_driver()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'driver'
  );
$function$;

-- 3. Fix is_guide function
CREATE OR REPLACE FUNCTION public.is_guide()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'guide'
  );
$function$;

-- 4. Fix current_user_roles function
CREATE OR REPLACE FUNCTION public.current_user_roles()
 RETURNS text[]
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT array_agg(role)
  FROM user_roles
  WHERE user_id = auth.uid();
$function$;

-- 5. Fix lock_price_after_payment function
CREATE OR REPLACE FUNCTION public.lock_price_after_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  if old.is_locked = true then
    raise exception 'Price is locked and cannot be updated';
  end if;
  return new;
end;
$function$;

-- 6. Fix prevent_price_change_after_payment function
CREATE OR REPLACE FUNCTION public.prevent_price_change_after_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM payment_receipts
    WHERE booking_id = NEW.booking_id
    AND status = 'paid'
  ) THEN
    RAISE EXCEPTION 'Price locked after payment';
  END IF;
  RETURN NEW;
END;
$function$;

-- 7. Fix mark_booking_paid function
CREATE OR REPLACE FUNCTION public.mark_booking_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  if new.is_locked = true then
    update bookings
    set payment_status = 'paid',
        status = 'confirmed',
        updated_at = now()
    where id = new.booking_id;
  end if;
  return new;
end;
$function$;

-- 8. Fix log_booking_status function
CREATE OR REPLACE FUNCTION public.log_booking_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history(
      booking_id,
      old_status,
      new_status,
      changed_by
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$function$;