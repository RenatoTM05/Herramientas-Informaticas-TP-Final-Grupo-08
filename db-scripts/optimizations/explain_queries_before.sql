-- ============================================================================
-- Archivo: explain_queries_before.sql
-- Historia de Usuario: HU-08 - Optimizacion de Consultas SQL y Base de Datos
-- Descripcion: Medicion de planes de ejecucion sobre el dataset de 6.000.000
--              de resenas ANTES de la aplicacion de indices optimizados.
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'INICIO: Medicion de Planes de Ejecucion Iniciales (Sin Indices HU-08)'
\echo '----------------------------------------------------------------------'

-- ============================================================================
-- Consulta 1: Listado de Resenas por Juego con Orden por Popularidad y JOIN
-- Endpoint: GET /api/resenas/juego/:juegoId
-- Modulo: backend/src/controllers/resena.controller.js (getResenasByJuego)
-- Vista Frontend: juego-detalle (carga paginada de resenas de la comunidad)
-- Problema: Parallel Seq Scan sobre 6.000.000 filas + Hash Left Join + Sort
-- ============================================================================
\echo '>>> [Q1 BEFORE] Resenas por juego con orden y JOIN a logins...'
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
-- Endpoint: GET /api/resenas/juego/:juegoId (findAndCountAll)
-- Modulo: backend/src/controllers/resena.controller.js (getResenasByJuego)
-- Vista Frontend: juego-detalle (calculo de totalPaginas)
-- Problema: Parallel Seq Scan sobre 6.000.000 filas para resolver COUNT(*)
-- ============================================================================
\echo '>>> [Q2 BEFORE] Conteo de resenas por juego...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) AS "count"
FROM "resenas" AS "resenas"
WHERE "resenas"."juegoId" = 42;

-- ============================================================================
-- Consulta 3: Verificacion de Resena Previa por Usuario en un Juego
-- Endpoint: POST /api/resenas
-- Modulo: backend/src/controllers/resena.controller.js (createResena: findOne)
-- Vista Frontend: juego-detalle (formulario de publicacion de resena)
-- Problema: Parallel Seq Scan sobre 6.000.000 filas para verificar existencia previa
-- ============================================================================
\echo '>>> [Q3 BEFORE] Verificacion de resena previa usuario-juego...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "id", "juegoId", "loginId", "texto", "likes", "createdAt", "updatedAt"
FROM "resenas" AS "resenas"
WHERE "resenas"."loginId" = 100 AND "resenas"."juegoId" = 42
LIMIT 1;

-- ============================================================================
-- Consulta 4: Juegos mejor calificados
-- Endpoint: GET /juego/mas-jugados
-- Modulo: backend/src/controllers/juego.controller.js (getMasJugados)
-- Problema: ordenamiento de catálogo sin filtro y LIMIT 10.
-- ============================================================================
\echo '>>> [Q4 BEFORE] Juegos mejor calificados...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "juegos" AS "juegos"
ORDER BY "juegos"."calificacion" DESC
LIMIT 10;

-- ============================================================================
-- Consulta 5: Busqueda Predictiva por Coincidencia Parcial (ILIKE '%texto%')
-- Endpoint: GET /api/juegos/sugerencias/:nombre
-- Modulo: backend/src/controllers/juego.controller.js (getSugerencias)
-- Vista Frontend: navbar (autocompletado interactivo mientras escribe el usuario)
-- Problema: ILIKE con comodin inicial ('%Cyber%') no optimizable con B-tree
-- ============================================================================
\echo '>>> [Q5 BEFORE] Sugerencias de busqueda predictiva (ILIKE)...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "juegos" AS "juegos"
WHERE "juegos"."titulo" ILIKE '%Cyber%'
ORDER BY "juegos"."calificacion" DESC
LIMIT 10;

-- ============================================================================
-- Consulta 6: Agregacion de Resenas para Ranking del Juego con Mas Resenas
-- Endpoint: GET /api/dashboard-juegos/estadisticas
-- Modulo: backend/src/controllers/dashboardJuego.controller.js (getEstadisticas)
-- Vista Frontend: dashboard (tarjeta de estadisticas de juegos comunitarios)
-- Problema: Parallel Seq Scan de 6M filas con HashAggregate masivo en RAM
-- ============================================================================
\echo '>>> [Q6 BEFORE] Agregacion GROUP BY sobre tabla resenas...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT "juegoId", COUNT("juegoId") AS "cantidad"
FROM "resenas" AS "resenas"
GROUP BY "juegoId"
ORDER BY "cantidad" DESC
LIMIT 1;

-- ============================================================================
-- Consulta 7: Autenticacion por username exacto
-- Endpoint: POST /api/login/loginUser
-- Modulo: backend/src/controllers/login.controller.js (loginUsuario)
-- Problema: busqueda exacta sin indice sobre username.
-- ============================================================================
\echo '>>> [Q7 BEFORE] Busqueda de usuario por username exacto...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM "logins" AS "logins"
WHERE "logins"."username" = 'gamer_10000'
LIMIT 1;

-- ============================================================================
-- Consulta 8: Total de busquedas de juegos
-- Endpoint: GET /dashboardJuego/estadisticas
-- Modulo: backend/src/controllers/dashboardJuego.controller.js (getEstadisticas)
-- Valor literal del controlador: BUSQUEDA_JUEGO.
-- ============================================================================
\echo '>>> [Q8 BEFORE] Conteo de busquedas de juego...'
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM "audit_logs" AS "audit_logs"
WHERE "audit_logs"."accion" = 'BUSQUEDA_JUEGO';

-- ============================================================================
-- Consulta 9 (Complementaria): Metrica de Accesos Diarios y Tasa de Exito
-- Endpoint: GET /api/dashboard/logins-por-dia
-- Modulo: backend/src/controllers/dashboard.controller.js (getLoginsPorDia)
-- Vista Frontend: dashboard administrativo (grafico temporal Chart.js)
-- Problema: Seq Scan sobre accesos con HashAggregate y filtro de fecha
-- ============================================================================
\echo '>>> [Q9 BEFORE] Accesos diarios y tasa de exito...'
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
\echo 'FIN: Medicion inicial de planes de ejecucion completada.'
\echo '----------------------------------------------------------------------'
