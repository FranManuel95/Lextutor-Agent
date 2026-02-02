-- Ensure attempt_type column exists
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exam_attempts' and column_name = 'attempt_type') then
        alter table public.exam_attempts add column attempt_type text not null check (attempt_type in ('quiz', 'exam_test', 'exam_open')) default 'quiz';
        create index if not exists idx_exam_attempts_user_type on public.exam_attempts(user_id, attempt_type);
    end if;
end $$;

-- Force schema cache reload (works if user has permissions, otherwise they need to do it in dashboard)
NOTIFY pgrst, 'reload schema';
