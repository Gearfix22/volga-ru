-- Fix v_booking_payment_guard view to include booking status check
-- CRITICAL: Payment should only be allowed for 'awaiting_payment' or 'approved' statuses

DROP VIEW IF EXISTS v_booking_payment_guard;

CREATE VIEW v_booking_payment_guard AS
SELECT 
    b.id AS booking_id,
    bp.admin_price AS approved_price,
    bp.locked,
    CASE
        -- Payment allowed ONLY when:
        -- 1. Price is set (admin_price IS NOT NULL)
        -- 2. Price is locked (locked = true)
        -- 3. Booking is in a payable status (awaiting_payment or approved)
        -- 4. Payment is not already completed
        WHEN bp.locked = true 
             AND bp.admin_price IS NOT NULL 
             AND b.status IN ('awaiting_payment', 'approved')
             AND b.payment_status != 'paid'
        THEN true
        ELSE false
    END AS can_pay
FROM bookings b
LEFT JOIN booking_prices bp ON bp.booking_id = b.id;

-- Add comment documenting the view purpose
COMMENT ON VIEW v_booking_payment_guard IS 
'Payment eligibility guard - SINGLE SOURCE OF TRUTH for determining if a booking can be paid.
Derives can_pay from: booking_prices.admin_price, booking_prices.locked, bookings.status, bookings.payment_status.
Only allows payment when price is set, locked, booking status is awaiting_payment/approved, and not already paid.';