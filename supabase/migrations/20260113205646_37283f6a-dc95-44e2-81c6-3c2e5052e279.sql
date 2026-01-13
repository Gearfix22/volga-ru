-- Create app_settings table for dynamic configuration
-- جدول إعدادات التطبيق للتكوين الديناميكي

CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  value_type text DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public can read public settings
CREATE POLICY "Anyone can read public settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (is_public = true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage all settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.is_admin());

-- Insert default settings (contact info, bank details, base prices)
INSERT INTO public.app_settings (key, value, category, description, value_type, is_public) VALUES
-- Contact Information
('company_name', 'Volga Services', 'contact', 'Company name', 'string', true),
('company_phone', '+7 952 221 29 03', 'contact', 'Main phone number', 'string', true),
('company_phone_raw', '79522212903', 'contact', 'Phone number without formatting', 'string', true),
('company_email', 'info@volgaservices.com', 'contact', 'Main email address', 'string', true),
('company_website', 'www.volgaservices.com', 'contact', 'Website URL', 'string', true),
('company_address_en', 'Leningrad Region, Vsevolozhsky District, Murino, Shuvalov St., 11', 'contact', 'Company address (English)', 'string', true),
('company_address_ru', 'обл. Ленинградская, р-н. Всеволожский, г. Мурино, ул. Шувалова, д. 11', 'contact', 'Company address (Russian)', 'string', true),
('company_address_ar', 'منطقة لينينغراد، مورينو، شارع شوفالوفا 11', 'contact', 'Company address (Arabic)', 'string', true),

-- Social Media
('whatsapp_number', '79522212903', 'social', 'WhatsApp number', 'string', true),
('facebook_url', 'https://www.facebook.com/profile.php?id=61574150824169', 'social', 'Facebook page URL', 'string', true),
('instagram_url', '', 'social', 'Instagram page URL', 'string', true),

-- Bank Details (for bank transfer)
('bank_name', 'Arab African International Bank', 'bank', 'Bank name', 'string', true),
('bank_account_holder', 'AHMED KAMAL ALSaeed Alshourbagy', 'bank', 'Account holder name', 'string', true),
('bank_iban', 'EG960057028801154116110010201', 'bank', 'IBAN number', 'string', true),
('bank_swift', 'ARAIEGCXCOL', 'bank', 'SWIFT/BIC code', 'string', true),

-- Pricing Configuration (base prices in USD)
('driver_base_price', '50', 'pricing', 'Base price for driver service', 'number', true),
('driver_business_addon', '30', 'pricing', 'Additional cost for business vehicle', 'number', true),
('driver_suv_addon', '20', 'pricing', 'Additional cost for SUV', 'number', true),
('driver_minivan_addon', '40', 'pricing', 'Additional cost for minivan', 'number', true),
('driver_van_addon', '60', 'pricing', 'Additional cost for van', 'number', true),
('driver_bus_addon', '100', 'pricing', 'Additional cost for bus', 'number', true),
('driver_round_trip_multiplier', '1.8', 'pricing', 'Multiplier for round trip pricing', 'number', true),

-- System Configuration
('default_currency', 'USD', 'system', 'Default currency code', 'string', true),
('supported_currencies', '["USD", "EUR", "RUB", "SAR", "EGP"]', 'system', 'List of supported currencies', 'json', true)

ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_app_settings_timestamp();