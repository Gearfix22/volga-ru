-- Fix SECURITY DEFINER issue on v_booking_payment_guard view
-- Recreate with SECURITY INVOKER to respect RLS

DROP VIEW IF EXISTS v_booking_payment_guard;

CREATE VIEW v_booking_payment_guard 
WITH (security_invoker = true)
AS
SELECT 
    b.id AS booking_id,
    bp.admin_price AS approved_price,
    bp.locked,
    CASE
        WHEN bp.locked = true 
             AND bp.admin_price IS NOT NULL 
             AND b.status IN ('awaiting_payment', 'approved')
             AND b.payment_status != 'paid'
        THEN true
        ELSE false
    END AS can_pay
FROM bookings b
LEFT JOIN booking_prices bp ON bp.booking_id = b.id;

COMMENT ON VIEW v_booking_payment_guard IS 
'Payment eligibility guard with SECURITY INVOKER. Respects RLS policies on underlying tables.';