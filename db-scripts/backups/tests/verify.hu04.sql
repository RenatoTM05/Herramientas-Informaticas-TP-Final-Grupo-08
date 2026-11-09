SET TIME ZONE 'UTC';

-- Conteos completos de la carga sintética de HU-06.
SELECT 'accesos', count(*) FROM accesos
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT 'juegos', count(*) FROM juegos
UNION ALL SELECT 'logins', count(*) FROM logins
UNION ALL SELECT 'resenas', count(*) FROM resenas
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
ORDER BY 1;

-- Huella de una muestra ordenada de las reseñas, además del conteo completo.
SELECT 'muestra_resenas', md5(string_agg(to_jsonb(muestra)::text, E'\n' ORDER BY id))
FROM (SELECT * FROM resenas ORDER BY id LIMIT 1000) AS muestra;

SELECT conrelid::regclass::text AS tabla, conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY tabla, conname;
