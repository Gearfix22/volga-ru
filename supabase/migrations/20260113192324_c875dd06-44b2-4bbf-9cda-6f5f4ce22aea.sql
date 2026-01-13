-- ==============================================
-- PAYMENT & PHONE IDENTITY ARCHITECTURE UPGRADE
-- ==============================================

-- 1. Drop old check constraint and add new one with EUR and RUB
ALTER TABLE currency_rates DROP CONSTRAINT IF EXISTS currency_rates_currency_code_check;
ALTER TABLE currency_rates ADD CONSTRAINT currency_rates_currency_code_check 
  CHECK (currency_code = ANY (ARRAY['USD', 'SAR', 'EGP', 'EUR', 'RUB']));

-- 2. Add EUR and RUB currencies
INSERT INTO currency_rates (currency_code, rate_to_usd, symbol, updated_at)
VALUES 
  ('EUR', 0.92, '€', NOW()),
  ('RUB', 92.50, '₽', NOW())
ON CONFLICT (currency_code) DO NOTHING;

-- 3. Add payment audit columns to bookings table (if not exists)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(12, 6),
ADD COLUMN IF NOT EXISTS final_paid_amount NUMERIC(12, 2);

-- 4. Add E.164 phone normalization columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'US',
ADD COLUMN IF NOT EXISTS dial_code TEXT DEFAULT '+1',
ADD COLUMN IF NOT EXISTS phone_e164 TEXT;

-- 5. Create a function to normalize phone numbers to E.164
CREATE OR REPLACE FUNCTION normalize_phone_e164(phone TEXT, dial_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  digits TEXT;
BEGIN
  -- Remove all non-digit characters
  digits := regexp_replace(phone, '[^0-9]', '', 'g');
  
  -- If dial code starts with +, use it; else add +
  IF dial_code LIKE '+%' THEN
    RETURN dial_code || digits;
  ELSE
    RETURN '+' || dial_code || digits;
  END IF;
END;
$$;

-- 6. Create index for phone_e164 lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_e164 ON profiles(phone_e164);

-- 7. Create audit view for payment tracking
CREATE OR REPLACE VIEW v_payment_audit AS
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

-- 8. Update old bookings to USD if currency is null
UPDATE bookings 
SET payment_currency = 'USD' 
WHERE payment_currency IS NULL AND paid_price IS NOT NULL;

-- 9. Documentation comments
COMMENT ON COLUMN bookings.payment_currency IS 'Currency selected by user at payment (USD, EUR, RUB, SAR, EGP)';
COMMENT ON COLUMN bookings.exchange_rate_used IS 'Exchange rate at time of payment for audit';
COMMENT ON COLUMN bookings.final_paid_amount IS 'Final amount in selected currency';
COMMENT ON COLUMN profiles.phone_e164 IS 'Phone in E.164 format for WhatsApp/OTP';
COMMENT ON COLUMN profiles.country_code IS 'ISO-2 country code (US, RU, EG)';
COMMENT ON COLUMN profiles.dial_code IS 'Dial code with + prefix (+1, +7, +20)';