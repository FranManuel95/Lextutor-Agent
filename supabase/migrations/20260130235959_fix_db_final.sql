-- Make session_id nullable and remove strict FK constraints
DO $$ 
BEGIN
    -- 1. Make session_id nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_attempts' AND column_name = 'session_id') THEN
        ALTER TABLE public.exam_attempts ALTER COLUMN session_id DROP NOT NULL;
    END IF;

    -- 2. Drop the specific FK constraint to exam_sessions if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'exam_attempts_session_id_fkey') THEN
        ALTER TABLE public.exam_attempts DROP CONSTRAINT exam_attempts_session_id_fkey;
    END IF;
END $$;

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
