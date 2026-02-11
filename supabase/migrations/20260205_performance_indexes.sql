-- Performance Indexes for Estudiante Elite
-- Created: 2026-02-05
-- Purpose: Optimize queries for RLS-protected tables

-- Chat Summaries
CREATE INDEX IF NOT EXISTS idx_chat_summaries_chat_id 
ON chat_summaries(chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_summaries_user_updated 
ON chat_summaries(user_id, updated_at DESC);

-- Messages (Critical for chat performance)
CREATE INDEX IF NOT EXISTS idx_messages_user_created 
ON messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON messages(chat_id, created_at DESC);

-- Chats (Sidebar queries)
CREATE INDEX IF NOT EXISTS idx_chats_user_updated 
ON chats(user_id, updated_at DESC);

-- Student Events (Progress tracking)
CREATE INDEX IF NOT EXISTS idx_student_events_user_chat 
ON student_events(user_id, chat_id, created_at DESC);

-- Profiles (Auth lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_id 
ON profiles(id);

-- Quiz/Exam Sessions
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_created 
ON quiz_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_created 
ON exam_sessions(user_id, created_at DESC);

-- Audit Logs (if exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
