
import { createClient } from '@supabase/supabase-js';

// When using Lovable's native Supabase integration, these variables are automatically provided
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tujborgbqzmcwolntvas.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1amJvcmdicXptY3dvbG50dmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzA5OTAsImV4cCI6MjA2NTUwNjk5MH0.qByawNYD150swSVCkQoPRv3AAhgX2x1o2HME9UzakIY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
