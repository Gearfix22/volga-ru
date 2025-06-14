
-- Create payment_orders table to track payment transactions
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL,
  payment_method TEXT DEFAULT 'paypal',
  transaction_id TEXT,
  booking_data JSONB,
  capture_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_transaction_id ON payment_orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Enable RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (edge functions)
CREATE POLICY "Service role can manage payment orders" ON payment_orders
  FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users to view their own payment orders
CREATE POLICY "Users can view own payment orders" ON payment_orders
  FOR SELECT USING (
    auth.uid()::text = (booking_data->>'userInfo'->>'userId')::text
  );
