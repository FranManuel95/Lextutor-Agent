-- Email preferences: opt-out for transactional / marketing emails.
-- Defaults to TRUE (opt-in at signup) but users can toggle off from the
-- profile dialog. The weekly summary cron MUST respect this flag.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_weekly_summary boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.email_weekly_summary IS
  'Whether the user wants to receive the weekly progress summary email. Defaults to true; toggled off from the profile dialog.';
