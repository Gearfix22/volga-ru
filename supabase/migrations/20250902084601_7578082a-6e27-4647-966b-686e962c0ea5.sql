-- Fix critical security vulnerability: Secure newsletter_subscriptions table
-- Enable RLS on newsletter_subscriptions table
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert newsletter subscriptions (for signup forms)
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Restrict SELECT access - only allow if user has admin role (when implemented)
-- For now, no one can read newsletter subscriptions directly from client
CREATE POLICY "Only admins can view newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (false);

-- Restrict UPDATE access to admins only (for status updates, unsubscribes via admin)
CREATE POLICY "Only admins can update newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR UPDATE 
USING (false);

-- Restrict DELETE access to admins only
CREATE POLICY "Only admins can delete newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR DELETE 
USING (false);

-- Create user roles system for proper admin access
-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create RLS policies for user_roles table
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Update newsletter policies to use proper admin check
DROP POLICY "Only admins can view newsletter subscriptions" ON public.newsletter_subscriptions;
DROP POLICY "Only admins can update newsletter subscriptions" ON public.newsletter_subscriptions;
DROP POLICY "Only admins can delete newsletter subscriptions" ON public.newsletter_subscriptions;

CREATE POLICY "Only admins can view newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Update contact_submissions policies to use proper admin check
DROP POLICY "Only admins can view contact submissions" ON public.contact_submissions;
DROP POLICY "Only admins can update contact submissions" ON public.contact_submissions;
DROP POLICY "Only admins can delete contact submissions" ON public.contact_submissions;

CREATE POLICY "Only admins can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update contact submissions" 
ON public.contact_submissions 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete contact submissions" 
ON public.contact_submissions 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));