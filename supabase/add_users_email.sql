-- Run once in Supabase SQL editor (required for password auth login/signup)
alter table public.users
  add column if not exists email text unique;
