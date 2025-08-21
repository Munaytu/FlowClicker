-- This migration adds a claimed_clicks column to the users table.
-- Please apply this migration to your Supabase database manually.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS claimed_clicks BIGINT DEFAULT 0;
