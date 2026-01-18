
-- Fix any inconsistent booking states where admin has set a price but payment_status is wrong
-- This ensures can_pay works correctly

-- Reset payment_status to 'pending' for bookings that:
-- 1. Have locked price in booking_prices
-- 2. Are in awaiting_payment or approved status
-- 3. Have payment_status NOT in ('pending', 'pending_verification', 'paid')
UPDATE bookings b
SET 
  payment_status = 'pending',
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM booking_prices bp 
  WHERE bp.booking_id = b.id 
  AND bp.locked = true 
  AND bp.admin_price IS NOT NULL
)
AND b.status IN ('awaiting_payment', 'approved')
AND b.payment_status NOT IN ('pending', 'pending_verification', 'paid');

-- Sync total_price from booking_prices.admin_price where missing
UPDATE bookings b
SET 
  total_price = bp.admin_price,
  updated_at = now()
FROM booking_prices bp
WHERE bp.booking_id = b.id
AND bp.admin_price IS NOT NULL
AND bp.locked = true
AND (b.total_price IS NULL OR b.total_price != bp.admin_price);