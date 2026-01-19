-- ============================================
-- DYNAMIC SERVICE INPUTS SCHEMA
-- Allows admin to define custom input fields per service
-- ============================================

-- Drop existing table if exists for clean slate
DROP TABLE IF EXISTS service_inputs CASCADE;

-- Create service_inputs table
CREATE TABLE IF NOT EXISTS public.service_inputs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  input_key text NOT NULL,
  label text NOT NULL,
  label_en text,
  label_ar text,
  label_ru text,
  input_type text NOT NULL DEFAULT 'text', -- text, number, date, time, select, textarea, checkbox
  placeholder text,
  placeholder_en text,
  placeholder_ar text,
  placeholder_ru text,
  options jsonb, -- For select type: [{ value: 'x', label: 'X' }]
  is_required boolean DEFAULT false,
  validation_rules jsonb, -- { min: 0, max: 100, pattern: 'regex' }
  default_value text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(service_id, input_key)
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_service_inputs_service_id ON public.service_inputs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_inputs_active ON public.service_inputs(service_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.service_inputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read, only admins can modify
CREATE POLICY "Anyone can view active service inputs"
ON public.service_inputs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all service inputs"
ON public.service_inputs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create booking_user_inputs to store user's input values for each booking
CREATE TABLE IF NOT EXISTS public.booking_user_inputs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  input_key text NOT NULL,
  input_value text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(booking_id, input_key)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_booking_user_inputs_booking_id ON public.booking_user_inputs(booking_id);

-- Enable RLS
ALTER TABLE public.booking_user_inputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own booking inputs"
ON public.booking_user_inputs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE bookings.id = booking_user_inputs.booking_id 
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Users can insert own booking inputs"
ON public.booking_user_inputs FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE bookings.id = booking_user_inputs.booking_id 
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all booking inputs"
ON public.booking_user_inputs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default inputs for existing service types
-- Driver Service Inputs
INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'pickupLocation', 'Pickup Location', 'Pickup Location', 'موقع الالتقاط', 'Место посадки', 'text', true, 1, 'Enter pickup address'
FROM public.services WHERE type = 'Driver' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'dropoffLocation', 'Drop-off Location', 'Drop-off Location', 'موقع النزول', 'Место высадки', 'text', true, 2, 'Enter drop-off address'
FROM public.services WHERE type = 'Driver' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order)
SELECT 
  id, 'pickupDate', 'Pickup Date', 'Pickup Date', 'تاريخ الالتقاط', 'Дата посадки', 'date', true, 3
FROM public.services WHERE type = 'Driver' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order)
SELECT 
  id, 'pickupTime', 'Pickup Time', 'Pickup Time', 'وقت الالتقاط', 'Время посадки', 'time', true, 4
FROM public.services WHERE type = 'Driver' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'vehicleType', 'Vehicle Type', 'Vehicle Type', 'نوع المركبة', 'Тип транспорта', 'select', true, 5,
  '[{"value":"economy","label":"Economy"},{"value":"comfort","label":"Comfort"},{"value":"business","label":"Business"},{"value":"suv","label":"SUV"},{"value":"minivan","label":"Minivan (7 seats)"},{"value":"van","label":"Van (12 seats)"}]'::jsonb
FROM public.services WHERE type = 'Driver' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'passengers', 'Number of Passengers', 'Number of Passengers', 'عدد الركاب', 'Количество пассажиров', 'select', true, 6,
  '[{"value":"1","label":"1"},{"value":"2","label":"2"},{"value":"3","label":"3"},{"value":"4","label":"4"},{"value":"5","label":"5"},{"value":"6","label":"6"},{"value":"7","label":"7"},{"value":"8","label":"8"},{"value":"10","label":"10"}]'::jsonb
FROM public.services WHERE type = 'Driver' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'specialRequests', 'Special Requests', 'Special Requests', 'طلبات خاصة', 'Особые пожелания', 'textarea', false, 99, 'Any special requirements...'
FROM public.services WHERE type = 'Driver' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

-- Accommodation Service Inputs
INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'location', 'Location', 'Location', 'الموقع', 'Местоположение', 'text', true, 1, 'City or area'
FROM public.services WHERE type = 'Accommodation' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order)
SELECT 
  id, 'checkIn', 'Check-in Date', 'Check-in Date', 'تاريخ الوصول', 'Дата заезда', 'date', true, 2
FROM public.services WHERE type = 'Accommodation' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order)
SELECT 
  id, 'checkOut', 'Check-out Date', 'Check-out Date', 'تاريخ المغادرة', 'Дата выезда', 'date', true, 3
FROM public.services WHERE type = 'Accommodation' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'guests', 'Number of Guests', 'Number of Guests', 'عدد الضيوف', 'Количество гостей', 'select', true, 4,
  '[{"value":"1","label":"1"},{"value":"2","label":"2"},{"value":"3","label":"3"},{"value":"4","label":"4"},{"value":"5","label":"5"},{"value":"6","label":"6+"}]'::jsonb
FROM public.services WHERE type = 'Accommodation' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'specialRequests', 'Special Requests', 'Special Requests', 'طلبات خاصة', 'Особые пожелания', 'textarea', false, 99, 'Any special requirements...'
FROM public.services WHERE type = 'Accommodation' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

-- Events Service Inputs
INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'eventType', 'Event Type', 'Event Type', 'نوع الحدث', 'Тип мероприятия', 'select', true, 1,
  '[{"value":"circus","label":"Circus"},{"value":"museum","label":"Museum"},{"value":"city_tour","label":"City Tour"},{"value":"opera","label":"Opera & Theater"},{"value":"sports","label":"Sports Event"},{"value":"concert","label":"Concert"},{"value":"other","label":"Other"}]'::jsonb
FROM public.services WHERE type = 'Events' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'location', 'Location', 'Location', 'الموقع', 'Местоположение', 'text', true, 2, 'Venue or city'
FROM public.services WHERE type = 'Events' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order)
SELECT 
  id, 'date', 'Event Date', 'Event Date', 'تاريخ الحدث', 'Дата мероприятия', 'date', true, 3
FROM public.services WHERE type = 'Events' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'numberOfPeople', 'Number of People', 'Number of People', 'عدد الأشخاص', 'Количество человек', 'select', true, 4,
  '[{"value":"1","label":"1"},{"value":"2","label":"2"},{"value":"3","label":"3"},{"value":"4","label":"4"},{"value":"5","label":"5"},{"value":"6","label":"6+"}]'::jsonb
FROM public.services WHERE type = 'Events' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'specialRequests', 'Special Requests', 'Special Requests', 'طلبات خاصة', 'Особые пожелания', 'textarea', false, 99, 'Any special requirements...'
FROM public.services WHERE type = 'Events' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

-- Guide Service Inputs
INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'location', 'Tour Location', 'Tour Location', 'موقع الجولة', 'Место экскурсии', 'text', true, 1, 'Where do you want to visit?'
FROM public.services WHERE type = 'Guide' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order)
SELECT 
  id, 'date', 'Tour Date', 'Tour Date', 'تاريخ الجولة', 'Дата экскурсии', 'date', true, 2
FROM public.services WHERE type = 'Guide' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'duration', 'Duration (hours)', 'Duration (hours)', 'المدة (ساعات)', 'Продолжительность (часов)', 'select', true, 3,
  '[{"value":"2","label":"2 hours"},{"value":"4","label":"4 hours"},{"value":"6","label":"6 hours"},{"value":"8","label":"Full day (8 hours)"}]'::jsonb
FROM public.services WHERE type = 'Guide' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'numberOfPeople', 'Group Size', 'Group Size', 'حجم المجموعة', 'Размер группы', 'select', true, 4,
  '[{"value":"1","label":"1"},{"value":"2","label":"2"},{"value":"3","label":"3"},{"value":"4","label":"4"},{"value":"5","label":"5"},{"value":"6","label":"6+"}]'::jsonb
FROM public.services WHERE type = 'Guide' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'specialRequests', 'Special Interests', 'Special Interests', 'اهتمامات خاصة', 'Особые интересы', 'textarea', false, 99, 'History, art, food, etc...'
FROM public.services WHERE type = 'Guide' AND is_active = true
ON CONFLICT (service_id, input_key) DO NOTHING;

-- Add generic inputs for Flight service (if exists)
INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'departureCity', 'Departure City', 'Departure City', 'مدينة المغادرة', 'Город вылета', 'text', true, 1, 'Where are you flying from?'
FROM public.services WHERE type = 'Flight' OR type LIKE 'Flight%'
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'arrivalCity', 'Destination City', 'Destination City', 'مدينة الوصول', 'Город прилета', 'text', true, 2, 'Where are you flying to?'
FROM public.services WHERE type = 'Flight' OR type LIKE 'Flight%'
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order)
SELECT 
  id, 'departureDate', 'Departure Date', 'Departure Date', 'تاريخ المغادرة', 'Дата вылета', 'date', true, 3
FROM public.services WHERE type = 'Flight' OR type LIKE 'Flight%'
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, options)
SELECT 
  id, 'passengers', 'Number of Passengers', 'Number of Passengers', 'عدد المسافرين', 'Количество пассажиров', 'select', true, 4,
  '[{"value":"1","label":"1"},{"value":"2","label":"2"},{"value":"3","label":"3"},{"value":"4","label":"4"},{"value":"5","label":"5+"}]'::jsonb
FROM public.services WHERE type = 'Flight' OR type LIKE 'Flight%'
ON CONFLICT (service_id, input_key) DO NOTHING;

INSERT INTO public.service_inputs (service_id, input_key, label, label_en, label_ar, label_ru, input_type, is_required, display_order, placeholder)
SELECT 
  id, 'specialRequests', 'Special Requests', 'Special Requests', 'طلبات خاصة', 'Особые пожелания', 'textarea', false, 99, 'Class preference, baggage, etc...'
FROM public.services WHERE type = 'Flight' OR type LIKE 'Flight%'
ON CONFLICT (service_id, input_key) DO NOTHING;