-- Missing indexes for high-frequency query patterns.
-- Each index targets a column used in WHERE/ORDER BY clauses on tables
-- that grow unbounded with user activity.

-- messages: fetched by chat_id on every conversation load
CREATE INDEX IF NOT EXISTS idx_messages_chat_id
  ON public.messages(chat_id, created_at DESC);

-- exam_attempts: filtered/ordered by user on the history page
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_created
  ON public.exam_attempts(user_id, created_at DESC);

-- quiz_sessions: looked up by user when grading
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id
  ON public.quiz_sessions(user_id);

-- exam_sessions: same pattern as quiz_sessions
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id
  ON public.exam_sessions(user_id);

-- student_events: audit log filtered by user
CREATE INDEX IF NOT EXISTS idx_student_events_user_id
  ON public.student_events(user_id, created_at DESC);

-- rate_limits: rolling window query — (user_id, endpoint, window_start) is the hot path
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint_window
  ON public.rate_limits(user_id, endpoint, window_start DESC);

-- chat_summaries: fetched by chat_id on every conversation load
CREATE INDEX IF NOT EXISTS idx_chat_summaries_chat_id
  ON public.chat_summaries(chat_id);
