-- Create storage bucket for payment receipts if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for payment receipts bucket
CREATE POLICY "Users can upload their own payment receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete payment receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  has_role(auth.uid(), 'admin'::app_role)
);