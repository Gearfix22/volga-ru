-- ============================================
-- 1. LOGIN/LOGOUT HISTORY TABLE
-- ============================================
CREATE TABLE public.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'driver', 'user')),
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all auth sessions"
  ON public.auth_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own sessions"
  ON public.auth_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_auth_sessions_user ON public.auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_created ON public.auth_sessions(created_at DESC);

-- ============================================
-- 2. CURRENCY SETTINGS & EXCHANGE RATES
-- ============================================
CREATE TABLE public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL UNIQUE CHECK (currency_code IN ('USD', 'SAR', 'EGP')),
  rate_to_usd NUMERIC NOT NULL DEFAULT 1,
  symbol TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view currency rates"
  ON public.currency_rates FOR SELECT USING (true);

CREATE POLICY "Admins can manage currency rates"
  ON public.currency_rates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default rates
INSERT INTO public.currency_rates (currency_code, rate_to_usd, symbol) VALUES
  ('USD', 1, '$'),
  ('SAR', 3.75, 'ر.س'),
  ('EGP', 30.90, 'ج.م');

-- Add preferred currency to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD' CHECK (preferred_currency IN ('USD', 'SAR', 'EGP'));

-- ============================================
-- 3. ADMIN PERMISSIONS (Scoped Roles)
-- ============================================
CREATE TYPE admin_permission AS ENUM (
  'users_create',
  'users_delete', 
  'users_view',
  'users_edit',
  'bookings_view',
  'bookings_edit',
  'payments_view',
  'payments_edit',
  'drivers_manage',
  'settings_manage',
  'full_access'
);

CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  permissions admin_permission[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin permissions"
  ON public.admin_permissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can manage permissions"
  ON public.admin_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap 
      WHERE ap.user_id = auth.uid() 
      AND 'full_access' = ANY(ap.permissions)
    )
  );

-- Function to check admin permission
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id UUID, _permission admin_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = _user_id
    AND ('full_access' = ANY(permissions) OR _permission = ANY(permissions))
  )
$$;

-- ============================================
-- 4. CUSTOMER NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking_update', 'payment', 'driver_assigned', 'driver_arrival', 'trip_complete', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.customer_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.customer_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.customer_notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_customer_notifications_user ON public.customer_notifications(user_id);
CREATE INDEX idx_customer_notifications_unread ON public.customer_notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- 5. DRIVER ROUTE HISTORY
-- ============================================
CREATE TABLE public.driver_route_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_route_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all route history"
  ON public.driver_route_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Drivers can insert own route history"
  ON public.driver_route_history FOR INSERT
  WITH CHECK (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role));

CREATE POLICY "Drivers can view own route history"
  ON public.driver_route_history FOR SELECT
  USING (driver_id = auth.uid() AND has_role(auth.uid(), 'driver'::app_role));

CREATE POLICY "Customers can view route for their bookings"
  ON public.driver_route_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = driver_route_history.booking_id
      AND b.user_id = auth.uid()
      AND b.show_driver_to_customer = true
    )
  );

CREATE INDEX idx_route_history_booking ON public.driver_route_history(booking_id);
CREATE INDEX idx_route_history_driver ON public.driver_route_history(driver_id);
CREATE INDEX idx_route_history_time ON public.driver_route_history(booking_id, recorded_at);

-- ============================================
-- 6. TRIGGERS FOR CUSTOMER NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_customer_booking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger for user bookings with status changes
  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.customer_notifications (user_id, booking_id, type, title, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'booking_update'
        WHEN NEW.status = 'assigned' THEN 'driver_assigned'
        WHEN NEW.status = 'on_trip' THEN 'driver_arrival'
        WHEN NEW.status = 'completed' THEN 'trip_complete'
        ELSE 'booking_update'
      END,
      CASE
        WHEN NEW.status = 'confirmed' THEN 'Booking Confirmed'
        WHEN NEW.status = 'assigned' THEN 'Driver Assigned'
        WHEN NEW.status = 'accepted' THEN 'Driver Accepted'
        WHEN NEW.status = 'on_trip' THEN 'Trip Started'
        WHEN NEW.status = 'completed' THEN 'Trip Completed'
        WHEN NEW.status = 'cancelled' THEN 'Booking Cancelled'
        ELSE 'Booking Updated'
      END,
      CASE
        WHEN NEW.status = 'confirmed' THEN 'Your booking has been confirmed by our team.'
        WHEN NEW.status = 'assigned' THEN 'A driver has been assigned to your booking.'
        WHEN NEW.status = 'accepted' THEN 'Your driver has accepted the trip.'
        WHEN NEW.status = 'on_trip' THEN 'Your trip has started. Track your driver in real-time.'
        WHEN NEW.status = 'completed' THEN 'Your trip has been completed. Thank you for choosing us!'
        WHEN NEW.status = 'cancelled' THEN 'Your booking has been cancelled.'
        ELSE 'Your booking status has been updated to ' || NEW.status
      END
    );
  END IF;
  
  -- Notify on payment status change
  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT NULL AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    IF NEW.payment_status = 'paid' THEN
      INSERT INTO public.customer_notifications (user_id, booking_id, type, title, message)
      VALUES (
        NEW.user_id,
        NEW.id,
        'payment',
        'Payment Confirmed',
        'Your payment has been confirmed. Thank you!'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_customer_booking_notification
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_booking_update();

-- Add currency fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'SAR', 'EGP')),
  ADD COLUMN IF NOT EXISTS original_price_usd NUMERIC;

-- Replica identity for realtime
ALTER TABLE public.customer_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.auth_sessions REPLICA IDENTITY FULL;