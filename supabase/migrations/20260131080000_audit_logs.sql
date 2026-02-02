-- Audit Logs: System Event Tracking
-- This table records critical events for security monitoring and debugging

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  action text not null,
  resource text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Index for fast queries by user and time
create index if not exists idx_audit_logs_user_created 
  on public.audit_logs(user_id, created_at desc);

create index if not exists idx_audit_logs_action_created 
  on public.audit_logs(action, created_at desc);

-- RLS: Only admins can view audit logs
alter table public.audit_logs enable row level security;

create policy "Admins can view all audit logs"
  on public.audit_logs for select
  using ( is_admin() );

-- Helper function to log events (callable from API routes via service role)
create or replace function public.log_audit_event(
  p_user_id uuid,
  p_action text,
  p_resource text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_ip_address text default null,
  p_user_agent text default null
)
returns uuid as $$
declare
  v_log_id uuid;
begin
  insert into public.audit_logs (user_id, action, resource, metadata, ip_address, user_agent)
  values (p_user_id, p_action, p_resource, p_metadata, p_ip_address, p_user_agent)
  returning id into v_log_id;
  
  return v_log_id;
end;
$$ language plpgsql security definer;
