-- Move exam stats calculation from Node.js to PostgreSQL.
-- Replaces an O(n) JavaScript loop (fetch all rows, filter/reduce in memory)
-- with a single SQL function using GROUP BY and gap-and-island streak logic.
-- The route now makes 2 queries (paginated items + this RPC) instead of
-- 1 paginated + 1 unbounded SELECT.

CREATE OR REPLACE FUNCTION public.get_exam_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak  int  := 0;
  v_longest_streak  int  := 0;
  v_last_active     date := null;
  v_by_type         jsonb := '{}';
  v_by_area         jsonb := '{}';
BEGIN
  -- Streak via gap-and-island:
  -- Consecutive active days form a "group" when (date - row_number) is constant.
  WITH daily_activity AS (
    SELECT DISTINCT created_at::date AS activity_date
    FROM   exam_attempts
    WHERE  user_id = p_user_id
      AND  status  = 'finished'
  ),
  numbered AS (
    SELECT
      activity_date,
      activity_date
        - (ROW_NUMBER() OVER (ORDER BY activity_date) || ' days')::interval AS grp
    FROM daily_activity
  ),
  streak_groups AS (
    SELECT
      grp,
      COUNT(*)::int        AS streak_length,
      MAX(activity_date)   AS streak_end
    FROM numbered
    GROUP BY grp
  )
  SELECT
    COALESCE(MAX(streak_length), 0),
    COALESCE(
      (SELECT streak_length
       FROM   streak_groups
       WHERE  streak_end >= CURRENT_DATE - INTERVAL '1 day'
       ORDER  BY streak_end DESC
       LIMIT  1),
      0
    ),
    (SELECT MAX(activity_date) FROM daily_activity)
  INTO v_longest_streak, v_current_streak, v_last_active
  FROM streak_groups;

  -- Averages by attempt type
  SELECT COALESCE(jsonb_object_agg(attempt_type, avg_score), '{}')
  INTO v_by_type
  FROM (
    SELECT attempt_type,
           ROUND(AVG(score)::numeric, 1) AS avg_score
    FROM   exam_attempts
    WHERE  user_id = p_user_id
      AND  status  = 'finished'
    GROUP  BY attempt_type
  ) t;

  -- Averages by legal area
  SELECT COALESCE(jsonb_object_agg(area, avg_score), '{}')
  INTO v_by_area
  FROM (
    SELECT area,
           ROUND(AVG(score)::numeric, 1) AS avg_score
    FROM   exam_attempts
    WHERE  user_id = p_user_id
      AND  status  = 'finished'
    GROUP  BY area
  ) t;

  RETURN jsonb_build_object(
    'streak',        v_current_streak,
    'longestStreak', v_longest_streak,
    'lastActive',    v_last_active,
    'averages',      jsonb_build_object(
      'byType', v_by_type,
      'byArea',  v_by_area
    )
  );
END;
$$;
