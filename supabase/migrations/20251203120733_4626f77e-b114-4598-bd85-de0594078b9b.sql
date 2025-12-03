-- Create admin_logs table for tracking admin actions
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_id UUID,
  target_table TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert admin logs
CREATE POLICY "Admins can view all admin logs"
ON public.admin_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert admin logs"
ON public.admin_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add missing RLS policies for bookings - allow admins to SELECT and UPDATE
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster admin log queries
CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX idx_admin_logs_target_id ON public.admin_logs(target_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);