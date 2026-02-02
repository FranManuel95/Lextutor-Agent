-- Add metadata column to exam/quiz sessions to store RAG usage info
DO $$ 
BEGIN
    -- For exam_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_sessions' AND column_name = 'metadata') THEN
        ALTER TABLE public.exam_sessions ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::JSONB;
    END IF;

    -- For quiz_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_sessions' AND column_name = 'metadata') THEN
        ALTER TABLE public.quiz_sessions ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::JSONB;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
