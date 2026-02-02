-- Add birth_date to profiles
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
