-- 1. Tutor Settings (Preferences)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN tutor_prefs JSONB NOT NULL DEFAULT '{}'::JSONB;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 2. Exam Sessions (Desarrollo)
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    area TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    questions JSONB NOT NULL,
    rubric JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Exam Attempts (Desarrollo)
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    grading JSONB NOT NULL,
    total_score INTEGER NOT NULL,
    honesty_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Quiz Sessions (Tipo Test)
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    area TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    questions JSONB NOT NULL, -- Includes options, correctIndex, explanation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Quiz Attempts (Tipo Test)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    grading JSONB NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Exam Policies
DO $$ 
BEGIN
    if not exists (select 1 from pg_policies where tablename = 'exam_sessions' and policyname = 'Users can manage their own exam sessions') then
        CREATE POLICY "Users can manage their own exam sessions"
        ON public.exam_sessions FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'exam_attempts' and policyname = 'Users can manage their own exam attempts') then
        CREATE POLICY "Users can manage their own exam attempts"
        ON public.exam_attempts FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'quiz_sessions' and policyname = 'Users can manage their own quiz sessions') then
        CREATE POLICY "Users can manage their own quiz sessions"
        ON public.quiz_sessions FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'quiz_attempts' and policyname = 'Users can manage their own quiz attempts') then
        CREATE POLICY "Users can manage their own quiz attempts"
        ON public.quiz_attempts FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    end if;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON public.exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_session_id ON public.exam_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_id ON public.quiz_attempts(session_id);
