-- ============================================================================
-- Archivo: explain_queries_after.sql
-- Historia de Usuario: HU-08 - Optimizacion de Consultas SQL y Base de Datos
-- Descripcion: Medicion de planes de ejecucion sobre el dataset de 6.000.000
--              de resenas DESPUES de la aplicacion de indices optimizados.
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'INICIO: Medicion de Planes de Ejecucion Posteriores (Con Indices HU-08)'
\echo '----------------------------------------------------------------------'

-- ============================================================================
-- Consulta 1: Listado de Resenas por Juego con Orden por Popularidad y JOIN
-- Indice Utilizado: idx_resenas_juegoid_likes_createdat
-- Expectativa: Index Scan sobre resenas + Index Scan sobre logins (Sin Sort)
-- ============================================================================
\echo '>>> [Q1 AFTER] Resenas por juego con orden y JOIN a logins...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "resenas"."id", "resenas"."juegoId", "resenas"."loginId", "resenas"."texto", "resenas"."likes", "resenas"."createdAt",
       "usuario"."id" AS "usuario.id", "usuario"."username" AS "usuario.username", "usuario"."nombre" AS "usuario.nombre", "usuario"."foto" AS "usuario.foto"
FROM "resenas" AS "resenas"
LEFT OUTER JOIN "logins" AS "usuario" ON "resenas"."loginId" = "usuario"."id"
WHERE "resenas"."juegoId" = 42
ORDER BY "resenas"."likes" DESC, "resenas"."createdAt" DESC
LIMIT 10 OFFSET 0;

-- ============================================================================
-- Consulta 2: Conteo Total de Resenas por Juego (Paginacion en Detalle)
-- Indice Utilizado: idx_resenas_juegoid_likes_createdat (Columna Lider: juegoId)
-- Expectativa: Index Only Scan (Heap Fetches: 0) sin indice redundante
-- ============================================================================
\echo '>>> [Q2 AFTER] Conteo de resenas por juego...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) AS "count"
FROM "resenas" AS "resenas"
WHERE "resenas"."juegoId" = 42;

-- ============================================================================
-- Consulta 3: Verificacion de Resena Previa por Usuario en un Juego
-- Indice Utilizado: idx_resenas_loginid_juegoid
-- Expectativa: Index Scan directo de 1 tupla (< 0.1 ms)
-- ============================================================================
\echo '>>> [Q3 AFTER] Verificacion de resena previa usuario-juego...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "id", "juegoId", "loginId", "texto", "likes", "createdAt", "updatedAt"
FROM "resenas" AS "resenas"
WHERE "resenas"."loginId" = 100 AND "resenas"."juegoId" = 42
LIMIT 1;

-- ============================================================================
-- Consulta 4: Juegos mejor calificados (getMasJugados)
-- Indice Utilizado: idx_juegos_calificacion_id_cov
-- ============================================================================
\echo '>>> [Q4 AFTER] Juegos mejor calificados...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "juegos" AS "juegos"
ORDER BY "juegos"."calificacion" DESC
LIMIT 10;

-- ============================================================================
-- Consulta 5: Busqueda Predictiva por Coincidencia Parcial (ILIKE '%texto%')
-- Indice Utilizado: idx_juegos_titulo_trgm (GIN trigram) o Covering Index
-- Expectativa: Resolucion acelerada de coincidencia de subcadena
-- ============================================================================
\echo '>>> [Q5 AFTER] Sugerencias de busqueda predictiva (ILIKE)...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "juegos" AS "juegos"
WHERE "juegos"."titulo" ILIKE '%Cyber%'
ORDER BY "juegos"."calificacion" DESC
LIMIT 10;

-- ============================================================================
-- Consulta 6: Agregacion de Resenas para Ranking del Juego con Mas Resenas
-- Indice Utilizado: idx_resenas_loginid_juegoid / idx_resenas_juegoid_likes_createdat
-- Expectativa: Parallel Index Only Scan (Heap Fetches: 0) en resenas
-- ============================================================================
\echo '>>> [Q6 AFTER] Agregacion GROUP BY sobre tabla resenas...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "juegoId", COUNT("juegoId") AS "cantidad"
FROM "resenas" AS "resenas"
GROUP BY "juegoId"
ORDER BY "cantidad" DESC
LIMIT 1;

-- ============================================================================
-- Consulta 7: Autenticacion por username exacto (loginUsuario)
-- Indice Utilizado: idx_logins_username.
-- ============================================================================
\echo '>>> [Q7 AFTER] Busqueda de usuario por username exacto...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "logins" AS "logins"
WHERE "logins"."username" = 'gamer_10000'
LIMIT 1;

-- ============================================================================
-- Consulta 8: Total de busquedas de juegos (getEstadisticas)
-- Indice Utilizado: idx_audit_logs_accion_fecha por su prefijo accion.
-- ============================================================================
\echo '>>> [Q8 AFTER] Conteo de busquedas de juego...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM "audit_logs" AS "audit_logs"
WHERE "audit_logs"."accion" = 'BUSQUEDA_JUEGO';

-- ============================================================================
-- Consulta 9 (Complementaria): Metrica de Accesos Diarios y Tasa de Exito
-- Indice Utilizado: idx_accesos_fecha_exito
-- Expectativa: Index Only Scan (Heap Fetches: 0)
-- ============================================================================
\echo '>>> [Q9 AFTER] Accesos diarios y tasa de exito...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT DATE("fecha") AS "dia",
       COUNT(*) AS "total",
       COUNT(CASE WHEN "exito" = true THEN 1 END) AS "exitosos",
       COUNT(CASE WHEN "exito" = false THEN 1 END) AS "fallidos"
FROM "accesos" AS "accesos"
WHERE "fecha" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("fecha")
ORDER BY DATE("fecha") ASC;

\echo '----------------------------------------------------------------------'
\echo 'FIN: Medicion final de planes de ejecucion completada.'
\echo '----------------------------------------------------------------------'
