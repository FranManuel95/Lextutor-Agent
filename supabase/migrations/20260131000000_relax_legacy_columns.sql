-- Relax legacy columns from tutor_eval.sql that might be enforcing NOT NULL
DO $$ 
BEGIN
    -- answers
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'answers') THEN
        ALTER TABLE public.exam_attempts ALTER COLUMN answers DROP NOT NULL;
    END IF;

    -- grading
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'grading') THEN
        ALTER TABLE public.exam_attempts ALTER COLUMN grading DROP NOT NULL;
    END IF;

    -- total_score (legacy integer)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'total_score') THEN
        ALTER TABLE public.exam_attempts ALTER COLUMN total_score DROP NOT NULL;
    END IF;
END $$;

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
