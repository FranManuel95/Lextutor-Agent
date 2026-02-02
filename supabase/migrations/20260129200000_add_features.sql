-- Add new columns to profiles
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN age INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Create student_events table for tracking progress
CREATE TABLE IF NOT EXISTS public.student_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    area TEXT,
    kind TEXT NOT NULL, -- e.g. 'answer_submitted', 'milestone_unlocked'
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for student_events
ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    if not exists (select 1 from pg_policies where tablename = 'student_events' and policyname = 'Users can insert their own events') then
        CREATE POLICY "Users can insert their own events" 
        ON public.student_events FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'student_events' and policyname = 'Users can view their own events') then
        CREATE POLICY "Users can view their own events" 
        ON public.student_events FOR SELECT 
        USING (auth.uid() = user_id);
    end if;
END $$;

-- Storage bucket for avatars (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DO $$ 
BEGIN
    if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Avatar images are publicly accessible') then
        CREATE POLICY "Avatar images are publicly accessible"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
    end if;

    if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Anyone can upload an avatar') then
        CREATE POLICY "Anyone can upload an avatar"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'avatars' );
    end if;

    if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Users can update their own avatar') then
        CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        USING ( bucket_id = 'avatars' AND auth.uid() = owner )
        WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );
    end if;
END $$;
