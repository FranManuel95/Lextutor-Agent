-- Question flags: lets users report a bad, ambiguous, or incorrect question
-- encountered during a quiz/exam. Admin can review via dashboard to improve
-- generation prompts or curate better prompts.

CREATE TABLE IF NOT EXISTS public.question_flags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id  uuid        REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
  session_id  uuid,
  question_id text        NOT NULL,
  question_text text,
  area        text,
  reason      text        NOT NULL CHECK (reason IN ('incorrect', 'ambiguous', 'off_topic', 'other')),
  comment     text,
  status      text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS question_flags_user_id_idx ON public.question_flags(user_id);
CREATE INDEX IF NOT EXISTS question_flags_status_idx  ON public.question_flags(status);
CREATE INDEX IF NOT EXISTS question_flags_created_at_idx ON public.question_flags(created_at DESC);

ALTER TABLE public.question_flags ENABLE ROW LEVEL SECURITY;

-- Users can insert their own flags
CREATE POLICY "users_insert_own_flags" ON public.question_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own flags
CREATE POLICY "users_read_own_flags" ON public.question_flags
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all flags (via service role; no RLS policy needed for service key).
-- Admin updates (status change) also go via service role in the admin panel.
