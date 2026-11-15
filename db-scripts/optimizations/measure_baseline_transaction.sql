-- HU-08: baseline reproducible without altering persistent data or indexes.
-- Execute with psql only after the HU-08 indexes exist.  The transaction is
-- always rolled back, so the comparison is a real execution against the same
-- dataset, cache state aside, with the proposed indexes absent.
\set ON_ERROR_STOP on
BEGIN;
DROP INDEX IF EXISTS idx_resenas_juegoid_likes_createdat;
DROP INDEX IF EXISTS idx_resenas_loginid_juegoid;
DROP INDEX IF EXISTS idx_juegos_calificacion_id_cov;
DROP INDEX IF EXISTS idx_juegos_titulo_trgm;
DROP INDEX IF EXISTS idx_logins_lower_username;
DROP INDEX IF EXISTS idx_logins_username;
DROP INDEX IF EXISTS idx_audit_logs_accion_fecha;
DROP INDEX IF EXISTS idx_accesos_fecha_exito;
\ir explain_queries_before.sql
ROLLBACK;
