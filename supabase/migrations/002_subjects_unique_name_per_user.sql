-- One subject name per user (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS subjects_user_id_name_lower_unique
  ON public.subjects (user_id, lower(trim(name)));
