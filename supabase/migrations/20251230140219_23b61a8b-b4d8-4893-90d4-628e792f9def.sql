-- Create table for AI guide conversation logs
CREATE TABLE public.ai_guide_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_guide_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert logs (including anonymous users)
CREATE POLICY "Anyone can insert AI guide logs"
  ON public.ai_guide_logs
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own logs
CREATE POLICY "Users can view own AI guide logs"
  ON public.ai_guide_logs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all logs
CREATE POLICY "Admins can view all AI guide logs"
  ON public.ai_guide_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_ai_guide_logs_session ON public.ai_guide_logs(session_id);
CREATE INDEX idx_ai_guide_logs_user ON public.ai_guide_logs(user_id);
CREATE INDEX idx_ai_guide_logs_created ON public.ai_guide_logs(created_at DESC);