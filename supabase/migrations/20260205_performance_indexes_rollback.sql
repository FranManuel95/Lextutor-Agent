-- ROLLBACK: Performance Indexes
-- Created: 2026-02-05
-- Purpose: Remove all performance indexes if needed

-- ⚠️ SOLO ejecutar si necesitas revertir la optimización

-- Chat Summaries
DROP INDEX IF EXISTS idx_chat_summaries_chat_id;
DROP INDEX IF EXISTS idx_chat_summaries_user_updated;

-- Messages
DROP INDEX IF EXISTS idx_messages_user_created;
DROP INDEX IF EXISTS idx_messages_chat_created;

-- Chats
DROP INDEX IF EXISTS idx_chats_user_updated;

-- Student Events
DROP INDEX IF EXISTS idx_student_events_user_chat;

-- Profiles
DROP INDEX IF EXISTS idx_profiles_id;

-- Quiz/Exam Sessions
DROP INDEX IF EXISTS idx_quiz_sessions_user_created;
DROP INDEX IF EXISTS idx_exam_sessions_user_created;

-- Audit Logs
DROP INDEX IF EXISTS idx_audit_logs_user_created;

-- ✅ Después de ejecutar esto, tu base de datos vuelve al estado original
-- Las queries seguirán funcionando, solo serán más lentas
