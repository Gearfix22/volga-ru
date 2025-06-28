/*
  # Fix RLS policies for user interaction tables

  1. Policy Updates
    - Update INSERT policies for `page_visits`, `form_interactions`, and `search_queries` tables
    - Fix the logic to properly handle both authenticated and unauthenticated users
    - Ensure unauthenticated users can insert data with NULL user_id
    - Ensure authenticated users can only insert data with their own user_id

  2. Changes Made
    - Replace problematic `auth.uid() = user_id OR user_id IS NULL` logic
    - Use explicit `(auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NULL)` logic
    - This prevents RLS violations for unauthenticated users
*/

-- Drop existing INSERT policies that are causing issues
DROP POLICY IF EXISTS "Users can insert their own page visits" ON public.page_visits;
DROP POLICY IF EXISTS "Users can insert their own form interactions" ON public.form_interactions;
DROP POLICY IF EXISTS "Users can insert their own search queries" ON public.search_queries;

-- Create new INSERT policies with proper logic for authenticated and unauthenticated users
CREATE POLICY "Users can insert their own page visits" ON public.page_visits
    FOR INSERT WITH CHECK (
        (auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NULL)
    );

CREATE POLICY "Users can insert their own form interactions" ON public.form_interactions
    FOR INSERT WITH CHECK (
        (auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NULL)
    );

CREATE POLICY "Users can insert their own search queries" ON public.search_queries
    FOR INSERT WITH CHECK (
        (auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NULL)
    );