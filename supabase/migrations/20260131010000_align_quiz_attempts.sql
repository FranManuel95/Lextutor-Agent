-- Add missing columns to quiz_attempts to align with exam_attempts structure
DO $$ 
BEGIN
    -- area
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_attempts' AND column_name = 'area') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN area text check (area in ('laboral', 'civil', 'mercantil', 'procesal', 'otro', 'general')) DEFAULT 'general';
    END IF;

    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_attempts' AND column_name = 'status') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN status text check (status in ('in_progress', 'finished')) DEFAULT 'finished';
    END IF;

    -- attempt_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_attempts' AND column_name = 'attempt_type') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN attempt_type text check (attempt_type in ('quiz', 'exam_test', 'exam_open')) DEFAULT 'quiz';
    END IF;

    -- payload (for flexibility/parity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_attempts' AND column_name = 'payload') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN payload jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_attempts' AND column_name = 'updated_at') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

END $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
