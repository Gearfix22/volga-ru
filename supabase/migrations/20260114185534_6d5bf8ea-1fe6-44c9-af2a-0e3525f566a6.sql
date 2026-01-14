-- ================================================
-- FIX 1: Recreate views with explicit SECURITY INVOKER
-- ================================================

-- Drop and recreate with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.v_admin_bookings;
CREATE VIEW public.v_admin_bookings 
WITH (security_invoker = true)
AS
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
CREATE VIEW public.v_booking_payment_guard 
WITH (security_invoker = true)
AS
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
CREATE VIEW public.v_payment_audit 
WITH (security_invoker = true)
AS
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
CREATE VIEW public.v_user_booking_dashboard 
WITH (security_invoker = true)
AS
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

-- ================================================
-- FIX 2: Add policy for login_attempts (RLS enabled but no policy)
-- ================================================
-- login_attempts should only be managed by service role (bypasses RLS)
-- Block all authenticated user access for security
CREATE POLICY "login_attempts_deny_all" ON public.login_attempts
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);