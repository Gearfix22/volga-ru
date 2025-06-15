
-- Create user interactions tracking tables

-- Create page visits table
CREATE TABLE public.page_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    page_url TEXT NOT NULL,
    page_title TEXT,
    visit_timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create form interactions table
CREATE TABLE public.form_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    form_type TEXT NOT NULL,
    form_data JSONB NOT NULL,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('started', 'field_changed', 'submitted', 'abandoned')),
    field_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search queries table
CREATE TABLE public.search_queries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    query_text TEXT NOT NULL,
    search_type TEXT,
    results_count INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    preference_type TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, preference_type)
);

-- Create contact form submissions table
CREATE TABLE public.contact_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'unsubscribed', 'bounced')),
    subscription_source TEXT,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_page_visits_user_id ON public.page_visits(user_id);
CREATE INDEX idx_page_visits_timestamp ON public.page_visits(visit_timestamp);
CREATE INDEX idx_form_interactions_user_id ON public.form_interactions(user_id);
CREATE INDEX idx_form_interactions_form_type ON public.form_interactions(form_type);
CREATE INDEX idx_search_queries_user_id ON public.search_queries(user_id);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);

-- Create updated_at triggers
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own page visits" ON public.page_visits
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own page visits" ON public.page_visits
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own form interactions" ON public.form_interactions
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own form interactions" ON public.form_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own search queries" ON public.search_queries
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own search queries" ON public.search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow public contact form submissions" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public newsletter subscriptions" ON public.newsletter_subscriptions
    FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.page_visits IS 'Track user page visits and navigation patterns';
COMMENT ON TABLE public.form_interactions IS 'Track user interactions with forms throughout the site';
COMMENT ON TABLE public.search_queries IS 'Track search queries made by users';
COMMENT ON TABLE public.user_preferences IS 'Store user preferences and settings';
COMMENT ON TABLE public.contact_submissions IS 'Store contact form submissions';
COMMENT ON TABLE public.newsletter_subscriptions IS 'Store newsletter subscription requests';
