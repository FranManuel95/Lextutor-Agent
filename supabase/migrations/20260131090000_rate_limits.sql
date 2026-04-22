-- Rate Limiting: Prevent API Abuse
-- This table tracks API usage per user to enforce rate limits

create table if not exists public.rate_limits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  endpoint text not null,
  window_start timestamptz not null,
  request_count integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Unique constraint: one record per user+endpoint+window
  unique(user_id, endpoint, window_start)
);

-- Index for fast lookups
create index if not exists idx_rate_limits_user_endpoint_window
  on public.rate_limits(user_id, endpoint, window_start desc);

-- RLS: Users can only see their own rate limit data
alter table public.rate_limits enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rate_limits'
      and policyname = 'Users can view own rate limits'
  ) then
    execute $policy$
      create policy "Users can view own rate limits"
        on public.rate_limits for select
        using ( auth.uid() = user_id )
    $policy$;
  end if;
end $$;

-- Auto-cleanup old records (older than 24 hours)
create or replace function public.cleanup_old_rate_limits()
returns void as $$
begin
  delete from public.rate_limits
  where window_start < now() - interval '24 hours';
end;
$$ language plpgsql security definer;

-- Helper function to check and increment rate limit
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_limit integer,
  p_window_minutes integer default 60
)
returns jsonb as $$
declare
  v_window_start timestamptz;
  v_current_count integer;
  v_allowed boolean;
begin
  -- Calculate window start (rounded down to the hour/window)
  v_window_start := date_trunc('hour', now());
  
  -- Get or create rate limit record
  insert into public.rate_limits (user_id, endpoint, window_start, request_count)
  values (p_user_id, p_endpoint, v_window_start, 1)
  on conflict (user_id, endpoint, window_start)
  do update set 
    request_count = rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_current_count;
  
  -- Check if limit exceeded
  v_allowed := v_current_count <= p_limit;
  
  return jsonb_build_object(
    'allowed', v_allowed,
    'current', v_current_count,
    'limit', p_limit,
    'reset_at', v_window_start + (p_window_minutes || ' minutes')::interval
  );
end;
$$ language plpgsql security definer;
