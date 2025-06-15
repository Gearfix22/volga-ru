
-- Create services catalog tables for customer selection

-- Create transportation services table
CREATE TABLE public.transportation_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('economy', 'business', 'minivan', 'bus')),
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    price_per_km DECIMAL(10,2),
    max_passengers INTEGER DEFAULT 1,
    features TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hotel services table
CREATE TABLE public.hotel_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hotel_name TEXT NOT NULL,
    city TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('standard', 'deluxe', 'suite', 'presidential')),
    description TEXT,
    base_price_per_night DECIMAL(10,2) NOT NULL,
    max_guests INTEGER DEFAULT 2,
    amenities TEXT[],
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event services table
CREATE TABLE public.event_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('concert', 'sports', 'cultural', 'business', 'entertainment')),
    venue TEXT NOT NULL,
    city TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    description TEXT,
    ticket_types JSONB NOT NULL, -- [{type: 'general', price: 50}, {type: 'vip', price: 150}]
    available_tickets INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom trip packages table
CREATE TABLE public.custom_trip_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    package_name TEXT NOT NULL,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('1-3-days', '4-7-days', '1-2-weeks', '3-4-weeks', '1-month+')),
    regions TEXT[] NOT NULL,
    included_activities TEXT[],
    base_price DECIMAL(10,2) NOT NULL,
    price_per_day DECIMAL(10,2),
    max_participants INTEGER DEFAULT 4,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'extreme')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service categories table for organization
CREATE TABLE public.service_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE CHECK (category_name IN ('Transportation', 'Hotels', 'Events', 'Custom Trips')),
    description TEXT,
    icon_name TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default service categories
INSERT INTO public.service_categories (category_name, description, icon_name, display_order) VALUES
('Transportation', 'Airport transfers, city tours, private drivers', 'Car', 1),
('Hotels', 'Hotel bookings, accommodation assistance', 'Building2', 2),
('Events', 'Event tickets, cultural experiences', 'Calendar', 3),
('Custom Trips', 'Personalized travel experiences', 'MapPin', 4);

-- Insert sample transportation services
INSERT INTO public.transportation_services (service_name, vehicle_type, description, base_price, price_per_km, max_passengers, features) VALUES
('Economy Airport Transfer', 'economy', 'Comfortable and affordable airport transfer service', 30.00, 1.50, 4, ARRAY['Air conditioning', 'Professional driver', 'Meet & greet']),
('Business Class Transfer', 'business', 'Premium transfer service with luxury vehicles', 60.00, 2.50, 4, ARRAY['Luxury vehicle', 'Professional chauffeur', 'Complimentary water', 'Phone charger']),
('Group Minivan Service', 'minivan', 'Spacious transport for groups and families', 80.00, 2.00, 8, ARRAY['Extra luggage space', 'Group seating', 'Air conditioning', 'Professional driver']),
('Charter Bus Service', 'bus', 'Large group transportation solution', 150.00, 3.00, 25, ARRAY['Large capacity', 'Professional driver', 'Air conditioning', 'Entertainment system']);

-- Insert sample hotel services
INSERT INTO public.hotel_services (hotel_name, city, room_type, description, base_price_per_night, max_guests, amenities, star_rating) VALUES
('Grand Plaza Hotel', 'Dubai', 'standard', 'Comfortable standard rooms in the heart of Dubai', 120.00, 2, ARRAY['WiFi', 'Air conditioning', 'Room service', 'City view'], 4),
('Grand Plaza Hotel', 'Dubai', 'deluxe', 'Spacious deluxe rooms with premium amenities', 180.00, 2, ARRAY['WiFi', 'Air conditioning', 'Room service', 'City view', 'Mini bar', 'Balcony'], 4),
('Grand Plaza Hotel', 'Dubai', 'suite', 'Luxurious suite with separate living area', 300.00, 4, ARRAY['WiFi', 'Air conditioning', 'Room service', 'City view', 'Mini bar', 'Balcony', 'Kitchenette', 'Living room'], 4),
('Luxury Resort & Spa', 'Abu Dhabi', 'standard', 'Beachfront resort with excellent facilities', 200.00, 2, ARRAY['Beach access', 'Pool', 'Spa', 'WiFi', 'Restaurant'], 5),
('Business Hotel Central', 'Sharjah', 'standard', 'Modern business hotel in central location', 90.00, 2, ARRAY['Business center', 'WiFi', 'Gym', 'Conference rooms'], 3);

-- Insert sample event services
INSERT INTO public.event_services (event_name, event_type, venue, city, event_date, event_time, description, ticket_types, available_tickets) VALUES
('Dubai International Music Festival', 'concert', 'Dubai Opera House', 'Dubai', '2024-12-15', '20:00', 'Annual international music festival featuring world-class artists', 
 '[{"type": "general", "price": 75}, {"type": "vip", "price": 150}, {"type": "premium", "price": 120}]', 500),
('UAE Football Championship', 'sports', 'Mohammed Bin Rashid Stadium', 'Dubai', '2024-12-20', '18:00', 'Exciting football championship match', 
 '[{"type": "general", "price": 50}, {"type": "vip", "price": 120}, {"type": "premium", "price": 80}]', 1000),
('Cultural Heritage Exhibition', 'cultural', 'Sheikh Mohammed Centre', 'Dubai', '2024-12-10', '10:00', 'Explore the rich cultural heritage of the Emirates', 
 '[{"type": "general", "price": 25}, {"type": "guided", "price": 45}]', 200);

-- Insert sample custom trip packages
INSERT INTO public.custom_trip_packages (package_name, duration_type, regions, included_activities, base_price, price_per_day, max_participants, difficulty_level, description) VALUES
('Desert Adventure Package', '1-3-days', ARRAY['Dubai Desert', 'Al Hajar Mountains'], 
 ARRAY['Desert safari', 'Camel riding', 'Sandboarding', 'Traditional dinner'], 
 250.00, 100.00, 6, 'moderate', 'Experience the magic of the Arabian desert'),
('Emirates City Explorer', '4-7-days', ARRAY['Dubai', 'Abu Dhabi', 'Sharjah'], 
 ARRAY['City tours', 'Museum visits', 'Shopping', 'Cultural experiences'], 
 500.00, 80.00, 8, 'easy', 'Comprehensive tour of major Emirates cities'),
('Adventure & Luxury Combo', '1-2-weeks', ARRAY['Dubai', 'Abu Dhabi', 'Ras Al Khaimah', 'Fujairah'], 
 ARRAY['Desert safari', 'Mountain hiking', 'Beach activities', 'Luxury spa', 'Fine dining'], 
 1200.00, 120.00, 4, 'moderate', 'Perfect blend of adventure and luxury experiences');

-- Create indexes for better performance
CREATE INDEX idx_transportation_services_vehicle_type ON public.transportation_services(vehicle_type);
CREATE INDEX idx_transportation_services_is_active ON public.transportation_services(is_active);
CREATE INDEX idx_hotel_services_city ON public.hotel_services(city);
CREATE INDEX idx_hotel_services_room_type ON public.hotel_services(room_type);
CREATE INDEX idx_hotel_services_is_active ON public.hotel_services(is_active);
CREATE INDEX idx_event_services_city ON public.event_services(city);
CREATE INDEX idx_event_services_event_date ON public.event_services(event_date);
CREATE INDEX idx_event_services_is_active ON public.event_services(is_active);
CREATE INDEX idx_custom_trip_packages_duration_type ON public.custom_trip_packages(duration_type);
CREATE INDEX idx_custom_trip_packages_is_active ON public.custom_trip_packages(is_active);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_transportation_services_updated_at 
    BEFORE UPDATE ON public.transportation_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_services_updated_at 
    BEFORE UPDATE ON public.hotel_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_services_updated_at 
    BEFORE UPDATE ON public.event_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_trip_packages_updated_at 
    BEFORE UPDATE ON public.custom_trip_packages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.transportation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_trip_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow read access to all authenticated and anonymous users)
CREATE POLICY "Allow public read access to transportation services" ON public.transportation_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to hotel services" ON public.hotel_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to event services" ON public.event_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to custom trip packages" ON public.custom_trip_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access to service categories" ON public.service_categories
    FOR SELECT USING (is_active = true);

-- Add comments for documentation
COMMENT ON TABLE public.transportation_services IS 'Available transportation services that customers can select';
COMMENT ON TABLE public.hotel_services IS 'Available hotel accommodations that customers can book';
COMMENT ON TABLE public.event_services IS 'Available events and tickets that customers can purchase';
COMMENT ON TABLE public.custom_trip_packages IS 'Pre-designed trip packages that customers can customize';
COMMENT ON TABLE public.service_categories IS 'Service category definitions for organizing services';
