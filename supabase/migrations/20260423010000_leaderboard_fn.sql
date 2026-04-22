-- Leaderboard RPC: returns top students ordered by one of two metrics:
--   'score'  — highest average finished-exam score (min 3 finished exams)
--   'streak' — highest current streak (reuses gap-and-island logic)
--
-- Returns first_name only (privacy) + initials from full_name. Avatar_url is
-- included to render identicons on the client. All ranked users are visible to
-- any authenticated user.

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_metric text DEFAULT 'score',
  p_limit  int  DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_metric = 'streak' THEN
    WITH activity AS (
      SELECT user_id, DATE(created_at) AS d
      FROM   exam_attempts
      WHERE  status = 'finished'
      GROUP  BY user_id, DATE(created_at)
    ),
    ranked AS (
      SELECT
        user_id,
        d,
        d - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d))::int * INTERVAL '1 day' AS grp
      FROM activity
    ),
    streaks AS (
      SELECT user_id, COUNT(*)::int AS len, MAX(d) AS end_d
      FROM   ranked
      GROUP  BY user_id, grp
    ),
    current_streaks AS (
      SELECT user_id, MAX(len) FILTER (WHERE end_d >= CURRENT_DATE - INTERVAL '1 day') AS streak
      FROM   streaks
      GROUP  BY user_id
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id',    p.id,
        'first_name', COALESCE(SPLIT_PART(p.full_name, ' ', 1), 'Anónimo'),
        'initials',   UPPER(SUBSTRING(COALESCE(p.full_name, 'U'), 1, 2)),
        'avatar_url', p.avatar_url,
        'value',      cs.streak
      ) ORDER BY cs.streak DESC NULLS LAST
    )
    INTO v_result
    FROM current_streaks cs
    JOIN profiles p ON p.id = cs.user_id
    WHERE cs.streak IS NOT NULL AND cs.streak > 0
    LIMIT p_limit;
  ELSE
    -- default 'score': avg of finished exam scores, min 3 attempts
    WITH agg AS (
      SELECT user_id, ROUND(AVG(score)::numeric, 1)::float AS avg_score, COUNT(*)::int AS n
      FROM   exam_attempts
      WHERE  status = 'finished'
      GROUP  BY user_id
      HAVING COUNT(*) >= 3
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id',    p.id,
        'first_name', COALESCE(SPLIT_PART(p.full_name, ' ', 1), 'Anónimo'),
        'initials',   UPPER(SUBSTRING(COALESCE(p.full_name, 'U'), 1, 2)),
        'avatar_url', p.avatar_url,
        'value',      agg.avg_score,
        'attempts',   agg.n
      ) ORDER BY agg.avg_score DESC
    )
    INTO v_result
    FROM agg
    JOIN profiles p ON p.id = agg.user_id
    LIMIT p_limit;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_leaderboard(text, int) TO authenticated;
