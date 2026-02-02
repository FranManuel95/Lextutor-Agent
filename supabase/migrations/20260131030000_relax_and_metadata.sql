-- Relax constraints on legacy columns AND add metadata for RAG
DO $$ 
BEGIN
    -- 1. Make legacy columns nullable in exam_attempts
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'answers') THEN
        ALTER TABLE public.exam_attempts ALTER COLUMN answers DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'grading') THEN
        ALTER TABLE public.exam_attempts ALTER COLUMN grading DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'total_score') THEN
        ALTER TABLE public.exam_attempts ALTER COLUMN total_score DROP NOT NULL;
    END IF;

    -- 2. Add metadata column for RAG tracking
    -- For exam_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_sessions' AND column_name = 'metadata') THEN
        ALTER TABLE public.exam_sessions ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::JSONB;
    END IF;

    -- For quiz_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_sessions' AND column_name = 'metadata') THEN
        ALTER TABLE public.quiz_sessions ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::JSONB;
    END IF;

    -- For quiz_attempts (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_attempts' AND column_name = 'metadata') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::JSONB;
    END IF;

END $$;

NOTIFY pgrst, 'reload schema';
