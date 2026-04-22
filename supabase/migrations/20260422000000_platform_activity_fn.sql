-- Platform activity aggregates for the last N days (admin dashboard).
-- Returns one row per day with exams completed and user messages sent.
CREATE OR REPLACE FUNCTION public.get_platform_activity(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date',     gs.day::text,
      'exams',    COALESCE(ea.cnt, 0),
      'messages', COALESCE(m.cnt, 0)
    ) ORDER BY gs.day
  )
  INTO v_result
  FROM generate_series(
    CURRENT_DATE - ((p_days - 1) || ' days')::interval,
    CURRENT_DATE,
    '1 day'::interval
  ) AS gs(day)
  LEFT JOIN (
    SELECT created_at::date AS d, COUNT(*)::int AS cnt
    FROM   exam_attempts
    WHERE  status     = 'finished'
      AND  created_at >= CURRENT_DATE - ((p_days - 1) || ' days')::interval
    GROUP  BY d
  ) ea ON ea.d = gs.day
  LEFT JOIN (
    SELECT created_at::date AS d, COUNT(*)::int AS cnt
    FROM   messages
    WHERE  role       = 'user'
      AND  created_at >= CURRENT_DATE - ((p_days - 1) || ' days')::interval
    GROUP  BY d
  ) m ON m.d = gs.day;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_activity(int) TO authenticated;
