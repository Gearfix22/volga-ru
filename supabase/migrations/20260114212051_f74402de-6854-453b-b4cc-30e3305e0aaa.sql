
-- ============================================
-- PHASE 1: DELETE DUPLICATE/UNUSED TABLES
-- ============================================

-- 1.1 Drop deprecated booking_price_workflow table (replaced by booking_prices)
DROP TABLE IF EXISTS booking_price_workflow CASCADE;

-- 1.2 Drop unused service-specific tables (services table is sufficient)
DROP TABLE IF EXISTS hotel_services CASCADE;
DROP TABLE IF EXISTS event_services CASCADE;
DROP TABLE IF EXISTS transportation_services CASCADE;
DROP TABLE IF EXISTS custom_trip_packages CASCADE;

-- 1.3 Drop unused i18n tables (JSON files used instead)
DROP TABLE IF EXISTS i18n_translations CASCADE;
DROP TABLE IF EXISTS i18n_keys CASCADE;
DROP TABLE IF EXISTS languages CASCADE;

-- 1.4 Drop legacy/dead tables
DROP TABLE IF EXISTS workflow_transitions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS search_queries CASCADE;

-- ============================================
-- PHASE 2: CLEAN UP BLOATED BOOKINGS TABLE
-- Remove price-related columns that duplicate booking_prices
-- ============================================

-- 2.1 Remove duplicate price columns from bookings 
-- (keeping only essential fields, price is in booking_prices)
ALTER TABLE bookings 
  DROP COLUMN IF EXISTS customer_proposed_price,
  DROP COLUMN IF EXISTS price_confirmed,
  DROP COLUMN IF EXISTS price_confirmed_at,
  DROP COLUMN IF EXISTS quoted_price,
  DROP COLUMN IF EXISTS admin_final_price,
  DROP COLUMN IF EXISTS paid_price,
  DROP COLUMN IF EXISTS original_price_usd,
  DROP COLUMN IF EXISTS quoted_price_snapshot,
  DROP COLUMN IF EXISTS currency_snapshot;

-- ============================================
-- PHASE 3: UNIFY NOTIFICATION TABLES
-- Create single unified notifications table
-- ============================================

-- 3.1 Create unified notification table
CREATE TABLE IF NOT EXISTS unified_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('user', 'admin', 'driver', 'guide')),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_unified_notifications_recipient 
  ON unified_notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_unified_notifications_unread 
  ON unified_notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_unified_notifications_booking 
  ON unified_notifications(booking_id);

-- 3.3 Migrate existing notifications to unified table
INSERT INTO unified_notifications (recipient_id, recipient_type, booking_id, type, title, message, is_read, created_at)
SELECT 
  COALESCE(target_admin_id, '00000000-0000-0000-0000-000000000000'::uuid),
  'admin',
  booking_id,
  type,
  type, -- title from type
  message,
  is_read,
  created_at
FROM notifications
WHERE target_admin_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO unified_notifications (recipient_id, recipient_type, booking_id, type, title, message, is_read, created_at)
SELECT 
  user_id,
  'user',
  booking_id,
  type,
  title,
  message,
  is_read,
  created_at
FROM customer_notifications
ON CONFLICT DO NOTHING;

INSERT INTO unified_notifications (recipient_id, recipient_type, booking_id, type, title, message, is_read, created_at)
SELECT 
  driver_id,
  'driver',
  booking_id,
  type,
  title,
  message,
  is_read,
  created_at
FROM driver_notifications
ON CONFLICT DO NOTHING;

INSERT INTO unified_notifications (recipient_id, recipient_type, booking_id, type, title, message, is_read, created_at)
SELECT 
  guide_id,
  'guide',
  booking_id,
  type,
  title,
  message,
  is_read,
  created_at
FROM guide_notifications
ON CONFLICT DO NOTHING;

-- 3.4 Drop old notification tables AFTER migration
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS customer_notifications CASCADE;
DROP TABLE IF EXISTS driver_notifications CASCADE;
DROP TABLE IF EXISTS guide_notifications CASCADE;

-- ============================================
-- PHASE 4: ENABLE RLS ON UNIFIED NOTIFICATIONS
-- ============================================

ALTER TABLE unified_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "users_read_own_notifications" ON unified_notifications
  FOR SELECT USING (
    (recipient_type = 'user' AND recipient_id = auth.uid()) OR
    (recipient_type = 'admin' AND public.is_admin()) OR
    (recipient_type = 'driver' AND public.is_driver()) OR
    (recipient_type = 'guide' AND public.is_guide())
  );

-- Users can mark their own notifications as read
CREATE POLICY "users_update_own_notifications" ON unified_notifications
  FOR UPDATE USING (
    (recipient_type = 'user' AND recipient_id = auth.uid()) OR
    (recipient_type = 'admin' AND public.is_admin()) OR
    (recipient_type = 'driver' AND public.is_driver()) OR
    (recipient_type = 'guide' AND public.is_guide())
  );

-- System/admins can create notifications for anyone
CREATE POLICY "system_create_notifications" ON unified_notifications
  FOR INSERT WITH CHECK (true);

-- ============================================
-- PHASE 5: ADD PROPER BOOKING STATUS ENUM
-- ============================================

-- Create booking status type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'draft',
      'pending',
      'under_review', 
      'approved',
      'awaiting_payment',
      'paid',
      'confirmed',
      'assigned',
      'accepted',
      'on_trip',
      'completed',
      'cancelled',
      'rejected'
    );
  END IF;
END $$;

-- ============================================
-- PHASE 6: ENSURE booking_prices HAS PROPER CONSTRAINTS
-- ============================================

-- Add approved_by column if missing
ALTER TABLE booking_prices 
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create price history table for audit trail
CREATE TABLE IF NOT EXISTS booking_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_price NUMERIC,
  new_price NUMERIC,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on price history
ALTER TABLE booking_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_price_history" ON booking_price_history
  FOR ALL USING (public.is_admin());

CREATE POLICY "users_read_own_price_history" ON booking_price_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_price_history.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );
