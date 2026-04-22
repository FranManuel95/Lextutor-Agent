-- Replace fixed-window rate limiting with rolling window
-- Fixes the bypass where users could make 2x the limit across an hour boundary.
-- New behavior: each INSERT is one request; COUNT(*) looks back p_window_minutes.

-- 1. Drop the unique constraint that assumed one row per window
ALTER TABLE public.rate_limits DROP CONSTRAINT IF EXISTS rate_limits_user_id_endpoint_window_start_key;

-- 2. Replace the check function with rolling window logic
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_limit integer,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb AS $$
DECLARE
  v_window_start timestamptz;
  v_count        integer;
  v_allowed      boolean;
  v_reset_at     timestamptz;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;

  -- Count requests in the rolling window
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limits
  WHERE user_id  = p_user_id
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;

  IF v_count < p_limit THEN
    -- Record this request
    INSERT INTO public.rate_limits (user_id, endpoint, window_start, request_count)
    VALUES (p_user_id, p_endpoint, now(), 1);
    v_count   := v_count + 1;
    v_allowed := true;
  ELSE
    v_allowed := false;
  END IF;

  -- reset_at = when the oldest request in the window expires
  SELECT MIN(window_start) + (p_window_minutes || ' minutes')::interval
    INTO v_reset_at
  FROM public.rate_limits
  WHERE user_id  = p_user_id
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;

  RETURN jsonb_build_object(
    'allowed',   v_allowed,
    'current',   v_count,
    'limit',     p_limit,
    'reset_at',  COALESCE(v_reset_at, now() + (p_window_minutes || ' minutes')::interval)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
