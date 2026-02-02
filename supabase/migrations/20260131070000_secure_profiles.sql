-- Secure Profiles: Prevent Privilege Escalation
-- This trigger ensures that a user cannot change their own 'role' field.
-- Only an internal admin process or direct DB modification can change roles.

create or replace function public.prevent_role_change()
returns trigger as $$
begin
  -- Check if the role is being modified
  if new.role is distinct from old.role then
      -- If the user executing the update is the same as the record owner
      -- (Standard RLS case for "Users can update own profile")
      if auth.uid() = old.id then
          raise exception 'Security Violation: You are not allowed to change your own role.';
      end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow idempotent runs
drop trigger if exists check_profile_update on public.profiles;

create trigger check_profile_update
  before update on public.profiles
  for each row
  execute function public.prevent_role_change();
