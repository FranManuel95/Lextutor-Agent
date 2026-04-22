-- Harden get_exam_stats: explicitly grant EXECUTE to authenticated role.
-- Postgres defaults EXECUTE to PUBLIC, which works but is broader than needed.
-- Revoking PUBLIC and granting only authenticated follows least-privilege.
REVOKE EXECUTE ON FUNCTION public.get_exam_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_exam_stats(uuid) TO authenticated;
