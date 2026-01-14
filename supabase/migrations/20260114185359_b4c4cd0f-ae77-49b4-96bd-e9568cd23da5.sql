-- ================================================
-- PHASE 1: Clean up duplicate bookings policies
-- ================================================

-- Drop ALL existing bookings policies (there are 21 duplicates)
DROP POLICY IF EXISTS "Admin full access on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin full control bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "admin_full_access_bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.bookings;
DROP POLICY IF EXISTS "Admins can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "user_insert_own_booking" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guides can view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guides can view bookings assigned to them" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "admin read bookings" ON public.bookings;
DROP POLICY IF EXISTS "select_bookings_admin_or_owner" ON public.bookings;
DROP POLICY IF EXISTS "Admin can update prices" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Drivers can update assigned bookings status" ON public.bookings;
DROP POLICY IF EXISTS "Guides can update assigned booking status" ON public.bookings;
DROP POLICY IF EXISTS "user_update_booking_before_payment" ON public.bookings;

-- Create CLEAN, NON-OVERLAPPING policies for bookings
-- SELECT policies
CREATE POLICY "bookings_select_admin" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "bookings_select_owner" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_select_driver" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    assigned_driver_id IS NOT NULL 
    AND assigned_driver_id = auth.uid() 
    AND public.has_role(auth.uid(), 'driver'::app_role)
  );

CREATE POLICY "bookings_select_guide" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    assigned_guide_id IS NOT NULL 
    AND assigned_guide_id = auth.uid() 
    AND public.has_role(auth.uid(), 'guide'::app_role)
  );

-- INSERT policies
CREATE POLICY "bookings_insert_user" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_insert_admin" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- UPDATE policies
CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "bookings_update_driver" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    assigned_driver_id = auth.uid() 
    AND public.has_role(auth.uid(), 'driver'::app_role)
  )
  WITH CHECK (
    assigned_driver_id = auth.uid() 
    AND public.has_role(auth.uid(), 'driver'::app_role)
  );

CREATE POLICY "bookings_update_guide" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    assigned_guide_id = auth.uid() 
    AND public.has_role(auth.uid(), 'guide'::app_role)
  )
  WITH CHECK (
    assigned_guide_id = auth.uid() 
    AND public.has_role(auth.uid(), 'guide'::app_role)
  );

CREATE POLICY "bookings_update_owner_draft" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    AND status IN ('draft', 'pending', 'pending_admin')
  )
  WITH CHECK (auth.uid() = user_id);

-- DELETE policies
CREATE POLICY "bookings_delete_admin" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ================================================
-- PHASE 2: Fix login_attempts overly permissive policy
-- ================================================
DROP POLICY IF EXISTS "Service role manages login_attempts" ON public.login_attempts;

-- Only service role should manage login_attempts (no authenticated user access)
-- RLS effectively blocks all authenticated users, service role bypasses RLS

-- ================================================
-- PHASE 3: Fix services duplicate policies
-- ================================================
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
-- Keep "public read active services" and "Anyone can view active services" (both have is_active = true)
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
-- Keep only one

-- ================================================
-- PHASE 4: Fix functions missing search_path
-- ================================================

CREATE OR REPLACE FUNCTION public.lock_price_after_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF old.is_locked = true THEN
    RAISE EXCEPTION 'Price is locked and cannot be updated';
  END IF;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_booking_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.mark_booking_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.is_locked = true THEN
    UPDATE bookings
    SET payment_status = 'paid',
        status = 'confirmed',
        updated_at = now()
    WHERE id = new.booking_id;
  END IF;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_price_change_after_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.prevent_price_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.locked = true THEN
    RAISE EXCEPTION 'Price is locked and cannot be updated';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_price_update_after_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.locked = true THEN
    RAISE EXCEPTION 'Price is locked and cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_price_update_when_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.locked = true THEN
    IF NEW.admin_price IS DISTINCT FROM OLD.admin_price THEN
      RAISE EXCEPTION 'Price is locked and cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.price_workflow_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent modification after lock
  IF OLD.locked = true THEN
    RAISE EXCEPTION 'Price is locked and cannot be modified';
  END IF;

  -- Approval without price = error
  IF NEW.status = 'approved' AND NEW.approved_price IS NULL THEN
    RAISE EXCEPTION 'approved_price is required when status is approved';
  END IF;

  -- Any decision other than pending locks the price
  IF NEW.status IN ('approved', 'rejected') THEN
    NEW.locked := true;
    NEW.approved_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_app_settings_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ================================================
-- PHASE 5: Fix views to use SECURITY INVOKER (default)
-- ================================================

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_admin_bookings;
CREATE VIEW public.v_admin_bookings AS
SELECT 
  b.id AS booking_id,
  b.status,
  b.created_at,
  bp.currency,
  bp.amount,
  bp.tax,
  bp.admin_price,
  bp.locked,
  ((bp.admin_price IS NOT NULL) AND (bp.locked = true)) AS can_pay
FROM bookings b
LEFT JOIN booking_prices bp ON bp.booking_id = b.id;

DROP VIEW IF EXISTS public.v_booking_payment_guard;
CREATE VIEW public.v_booking_payment_guard AS
SELECT 
  b.id AS booking_id,
  bp.admin_price AS approved_price,
  bp.locked,
  CASE
    WHEN (bp.locked = true AND bp.admin_price IS NOT NULL) THEN true
    ELSE false
  END AS can_pay
FROM bookings b
LEFT JOIN booking_prices bp ON bp.booking_id = b.id;

DROP VIEW IF EXISTS public.v_payment_audit;
CREATE VIEW public.v_payment_audit AS
SELECT 
  b.id AS booking_id,
  b.user_id,
  b.service_type,
  b.payment_method,
  b.payment_status,
  b.transaction_id,
  bpw.approved_price AS base_price_usd,
  b.payment_currency,
  b.exchange_rate_used,
  b.final_paid_amount,
  b.created_at AS booking_date,
  b.updated_at AS payment_date,
  p.full_name AS customer_name,
  p.phone_e164 AS customer_phone
FROM bookings b
LEFT JOIN booking_price_workflow bpw ON b.id = bpw.booking_id
LEFT JOIN profiles p ON b.user_id = p.id
WHERE b.payment_status IN ('paid', 'pending_verification');

DROP VIEW IF EXISTS public.v_user_booking_dashboard;
CREATE VIEW public.v_user_booking_dashboard AS
SELECT 
  b.id AS booking_id,
  b.status,
  b.created_at,
  bp.currency,
  bp.admin_price,
  bp.locked,
  CASE
    WHEN bp.locked = true THEN 'approved'
    ELSE 'pending'
  END AS price_status
FROM bookings b
LEFT JOIN booking_prices bp ON bp.booking_id = b.id;