-- Fix security issues: Enable RLS and add policies
-- إصلاح مشاكل الأمان: تفعيل RLS وإضافة السياسات

-- 1. Enable RLS on tables that don't have it
ALTER TABLE public.ai_guide_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;

-- 2. Add policies for ai_guide_sessions
-- Users can read their own sessions
CREATE POLICY "Users can read own ai_guide_sessions"
ON public.ai_guide_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own ai_guide_sessions"
ON public.ai_guide_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own ai_guide_sessions"
ON public.ai_guide_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow anonymous sessions (guests) - read only for guest sessions
CREATE POLICY "Allow anonymous ai_guide_sessions"
ON public.ai_guide_sessions
FOR SELECT
TO anon
USING (user_id IS NULL);

-- 3. Add policies for ui_translations (public read, admin write)
CREATE POLICY "Anyone can read ui_translations"
ON public.ui_translations
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage ui_translations"
ON public.ui_translations
FOR ALL
TO authenticated
USING (public.is_admin());

-- 4. Add policies for workflow_transitions (admin only)
CREATE POLICY "Admins can read workflow_transitions"
ON public.workflow_transitions
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage workflow_transitions"
ON public.workflow_transitions
FOR ALL
TO authenticated
USING (public.is_admin());

-- 5. Add policies for booking_price_workflow (RLS enabled but no policies)
-- Users can read their own booking price workflows
CREATE POLICY "Users can read own booking_price_workflow"
ON public.booking_price_workflow
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND b.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- Admins can manage all booking price workflows
CREATE POLICY "Admins can manage booking_price_workflow"
ON public.booking_price_workflow
FOR ALL
TO authenticated
USING (public.is_admin());

-- 6. Add policies for i18n tables (public read, admin write)
CREATE POLICY "Anyone can read i18n_keys"
ON public.i18n_keys
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage i18n_keys"
ON public.i18n_keys
FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "Anyone can read i18n_translations"
ON public.i18n_translations
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage i18n_translations"
ON public.i18n_translations
FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "Anyone can read languages"
ON public.languages
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage languages"
ON public.languages
FOR ALL
TO authenticated
USING (public.is_admin());