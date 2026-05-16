-- Run once in Supabase SQL editor (or via Supabase CLI migrate)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash text;
