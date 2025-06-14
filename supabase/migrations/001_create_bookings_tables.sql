
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('Transportation', 'Hotels', 'Events', 'Custom Trips')),
    
    -- Customer Information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_language TEXT NOT NULL DEFAULT 'English',
    
    -- Payment Information
    payment_method TEXT,
    transaction_id TEXT,
    payment_amount DECIMAL(10,2),
    total_price DECIMAL(10,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    
    -- Booking Status
    booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Service Details (JSON for flexibility)
    service_details JSONB NOT NULL
);

-- Create transportation_bookings table for detailed transportation info
CREATE TABLE public.transportation_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    travel_date DATE NOT NULL,
    travel_time TIME NOT NULL,
    vehicle_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hotel_bookings table for detailed hotel info
CREATE TABLE public.hotel_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    hotel_name TEXT NOT NULL,
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    room_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_bookings table for detailed event info
CREATE TABLE public.event_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_location TEXT NOT NULL,
    event_date DATE NOT NULL,
    tickets_quantity TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom_trip_bookings table for detailed custom trip info
CREATE TABLE public.custom_trip_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    duration TEXT NOT NULL,
    regions TEXT NOT NULL,
    interests TEXT[], -- Array of interests
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_service_type ON public.bookings(service_type);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_bookings_booking_status ON public.bookings(booking_status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_trip_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings table
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transportation_bookings
CREATE POLICY "Users can view their transportation bookings" ON public.transportation_bookings
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their transportation bookings" ON public.transportation_bookings
    FOR INSERT WITH CHECK (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for hotel_bookings
CREATE POLICY "Users can view their hotel bookings" ON public.hotel_bookings
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their hotel bookings" ON public.hotel_bookings
    FOR INSERT WITH CHECK (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for event_bookings
CREATE POLICY "Users can view their event bookings" ON public.event_bookings
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their event bookings" ON public.event_bookings
    FOR INSERT WITH CHECK (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for custom_trip_bookings
CREATE POLICY "Users can view their custom trip bookings" ON public.custom_trip_bookings
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their custom trip bookings" ON public.custom_trip_bookings
    FOR INSERT WITH CHECK (
        booking_id IN (
            SELECT id FROM public.bookings WHERE user_id = auth.uid()
        )
    );
