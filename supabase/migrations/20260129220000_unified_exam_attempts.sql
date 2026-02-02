-- Create enum for attempt types and areas if strictly needed, or just text constraints
-- We will use text constraints for simplicity and flexibility as requested "text not null"

create table if not exists public.exam_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    chat_id uuid null, -- optional link to chat context
    attempt_type text not null check (attempt_type in ('quiz', 'exam_test', 'exam_open')),
    area text not null check (area in ('laboral', 'civil', 'mercantil', 'procesal', 'otro', 'general')),
    score numeric(3,1) not null check (score >= 0.0 and score <= 10.0),
    status text not null check (status in ('in_progress', 'finished')),
    questions_count int null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Ensure all columns exist (Idempotency fix for existing tables)
DO $$ 
BEGIN
    -- attempt_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'attempt_type') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN attempt_type text not null check (attempt_type in ('quiz', 'exam_test', 'exam_open')) DEFAULT 'quiz';
    END IF;

    -- area
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'area') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN area text not null check (area in ('laboral', 'civil', 'mercantil', 'procesal', 'otro', 'general')) DEFAULT 'general';
    END IF;

    -- score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'score') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN score numeric(3,1) not null check (score >= 0.0 and score <= 10.0) DEFAULT 0.0;
    END IF;

    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'status') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN status text not null check (status in ('in_progress', 'finished')) DEFAULT 'finished';
    END IF;

    -- questions_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'questions_count') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN questions_count int null;
    END IF;

    -- payload
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'payload') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN payload jsonb not null default '{}'::jsonb;
    END IF;

    -- chat_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'chat_id') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN chat_id uuid null;
    END IF;
END $$;

-- Enable RLS
alter table public.exam_attempts enable row level security;

-- Policies
DO $$ 
BEGIN
    if not exists (select 1 from pg_policies where tablename = 'exam_attempts' and policyname = 'Users can view their own attempts') then
        create policy "Users can view their own attempts"
            on public.exam_attempts for select
            using (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'exam_attempts' and policyname = 'Users can insert their own attempts') then
        create policy "Users can insert their own attempts"
            on public.exam_attempts for insert
            with check (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'exam_attempts' and policyname = 'Users can update their own attempts') then
        create policy "Users can update their own attempts"
            on public.exam_attempts for update
            using (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'exam_attempts' and policyname = 'Users can delete their own attempts') then
        create policy "Users can delete their own attempts"
            on public.exam_attempts for delete
            using (auth.uid() = user_id);
    end if;
END $$;

-- Indexes
create index if not exists idx_exam_attempts_user_created on public.exam_attempts(user_id, created_at desc);
create index if not exists idx_exam_attempts_user_type on public.exam_attempts(user_id, attempt_type);
create index if not exists idx_exam_attempts_user_area on public.exam_attempts(user_id, area);
create index if not exists idx_exam_attempts_user_status on public.exam_attempts(user_id, status);
