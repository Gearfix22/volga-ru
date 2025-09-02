-- Fix critical security vulnerability: Secure contact_submissions table
-- Enable RLS on contact_submissions table
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert contact submissions (for contact forms)
CREATE POLICY "Anyone can submit contact forms" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Restrict SELECT access - only allow if user has admin role (when implemented)
-- For now, no one can read contact submissions directly from client
CREATE POLICY "Only admins can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (false);

-- Restrict UPDATE access to admins only (for status updates)
CREATE POLICY "Only admins can update contact submissions" 
ON public.contact_submissions 
FOR UPDATE 
USING (false);

-- Restrict DELETE access to admins only
CREATE POLICY "Only admins can delete contact submissions" 
ON public.contact_submissions 
FOR DELETE 
USING (false);