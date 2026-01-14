
-- CRITICAL FIX: Consolidate price architecture
-- Single source of truth: booking_prices table
-- v_booking_payment_guard is the ONLY view for payment eligibility

-- Step 1: Fix v_payment_audit to use booking_prices (was using booking_price_workflow)
DROP VIEW IF EXISTS v_payment_audit;
CREATE VIEW v_payment_audit WITH (SECURITY_INVOKER = true) AS
SELECT 
  b.id AS booking_id,
  b.user_id,
  b.service_type,
  b.payment_method,
  b.payment_status,
  b.transaction_id,
  bp.admin_price AS base_price_usd, -- CHANGED: from booking_price_workflow to booking_prices
  b.payment_currency,
  b.exchange_rate_used,
  b.final_paid_amount,
  b.created_at AS booking_date,
  b.updated_at AS payment_date,
  p.full_name AS customer_name,
  p.phone_e164 AS customer_phone
FROM bookings b
LEFT JOIN booking_prices bp ON b.id = bp.booking_id -- CHANGED: was booking_price_workflow
LEFT JOIN profiles p ON b.user_id = p.id
WHERE b.payment_status IN ('paid', 'pending_verification');

-- Step 2: Add unique constraint on booking_prices.booking_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'booking_prices_booking_id_unique'
  ) THEN
    ALTER TABLE booking_prices ADD CONSTRAINT booking_prices_booking_id_unique UNIQUE (booking_id);
  END IF;
END $$;

-- Step 3: Add RLS policy for users to read their own booking prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'users read own booking_prices' 
    AND tablename = 'booking_prices'
  ) THEN
    CREATE POLICY "users read own booking_prices" ON booking_prices
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_prices.booking_id
      AND b.user_id = auth.uid()
    ));
  END IF;
END $$;

-- Step 4: Add admin INSERT/UPDATE/DELETE on booking_prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'admin manage booking_prices' 
    AND tablename = 'booking_prices'
  ) THEN
    CREATE POLICY "admin manage booking_prices" ON booking_prices
    FOR ALL
    USING (EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    ));
  END IF;
END $$;

-- Step 5: Sync existing data from booking_price_workflow to booking_prices where missing
INSERT INTO booking_prices (booking_id, admin_price, amount, currency, locked, created_at, updated_at)
SELECT 
  bpw.booking_id,
  bpw.approved_price,
  COALESCE(bpw.approved_price, bpw.proposed_price),
  bpw.currency,
  bpw.locked,
  bpw.created_at,
  bpw.updated_at
FROM booking_price_workflow bpw
LEFT JOIN booking_prices bp ON bp.booking_id = bpw.booking_id
WHERE bp.booking_id IS NULL
  AND bpw.approved_price IS NOT NULL;
