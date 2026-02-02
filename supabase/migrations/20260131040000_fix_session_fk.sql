-- Make session_id nullable in exam_attempts and drop the foreign key constraint
DO $$ 
BEGIN
    -- 1. Make session_id nullable
    ALTER TABLE public.exam_attempts ALTER COLUMN session_id DROP NOT NULL;

    -- 2. Drop the foreign key constraint if it exists
    -- This allows session_id to hold IDs from quiz_sessions as well (or be null)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'exam_attempts_session_id_fkey') THEN
        ALTER TABLE public.exam_attempts DROP CONSTRAINT exam_attempts_session_id_fkey;
    END IF;

END $$;

NOTIFY pgrst, 'reload schema';
