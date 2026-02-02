-- Fix migration to ensure columns exist even if table was already created
-- This handles the case where "create table if not exists" skipped column creation

do $$ 
begin
    -- Area
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exam_attempts' and column_name = 'area') then
        alter table public.exam_attempts add column area text not null check (area in ('laboral', 'civil', 'mercantil', 'procesal', 'otro', 'general')) default 'general';
    end if;

    -- Payload
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exam_attempts' and column_name = 'payload') then
        alter table public.exam_attempts add column payload jsonb not null default '{}'::jsonb;
    end if;

    -- Questions Count
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exam_attempts' and column_name = 'questions_count') then
        alter table public.exam_attempts add column questions_count int null;
    end if;

    -- Chat ID
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exam_attempts' and column_name = 'chat_id') then
        alter table public.exam_attempts add column chat_id uuid null;
    end if;

    -- Score (check if needs alteration or just exists)
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exam_attempts' and column_name = 'score') then
        alter table public.exam_attempts add column score numeric(3,1) not null default 0.0;
    end if;

    -- Status
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exam_attempts' and column_name = 'status') then
        alter table public.exam_attempts add column status text not null default 'finished';
    end if;

end $$;
