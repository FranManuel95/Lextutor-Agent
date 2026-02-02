-- FORCE drop of the foreign key constraint that blocks quizzes
DO $$ 
BEGIN
    -- Drop the constraint if it exists (using the exact name from the error)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'exam_attempts_session_id_fkey') THEN
        ALTER TABLE public.exam_attempts DROP CONSTRAINT exam_attempts_session_id_fkey;
    END IF;

    -- Also ensure session_id is nullable
    ALTER TABLE public.exam_attempts ALTER COLUMN session_id DROP NOT NULL;
END $$;

NOTIFY pgrst, 'reload schema';
