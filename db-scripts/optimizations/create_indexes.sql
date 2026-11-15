-- ============================================================================
-- Archivo: create_indexes.sql
-- Historia de Usuario: HU-08 - Optimizacion de Consultas SQL y Base de Datos
-- Descripcion: Sentencias DDL de creacion de indices simples, compuestos,
--              de cobertura (INCLUDE), funcionales y GIN (pg_trgm).
--              Disenado bajo el principio de NO REDUNDANCIA tecnica.
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'INICIO: Creacion de Indices Optimizados (HU-08)'
\echo '----------------------------------------------------------------------'

-- Habilitar extension de trigramas para soporte de busquedas difusas/comodines
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Asignar memoria temporal suficiente para la construccion de indices sobre 6M tuplas
SET maintenance_work_mem = '256MB';

-- ----------------------------------------------------------------------------
-- 1. Indice Compuesto B-Tree para Paginacion y Orden de Resenas por Juego
-- Tabla: resenas (6.000.000 tuplas)
-- Columnas: ("juegoId", likes DESC, "createdAt" DESC)
-- Justificacion Tecnica:
--   - Resuelve Consulta 1 (filtro WHERE "juegoId" y orden likes DESC, createdAt DESC).
--   - Resuelve simultaneamente el filtro y la secuencia de ordenamiento,
--     eliminando el nodo Sort (top-N heapsort) y sustituyendo el Parallel Seq Scan
--     por un Index Scan.
--   - Resuelve Consulta 2 (COUNT(*) WHERE "juegoId" = X) mediante Index Only Scan
--     debido a que "juegoId" es el prefijo izquierdo (columna lider) del indice.
--   - NO REDUNDANCIA: No se crea un indice simple en ("juegoId") porque este
--     compuesto satisface plenamente las busquedas por juegoId solo, ahorrando
--     39 MB de almacenamiento y evitando doble penalizacion en escrituras (INSERT).
-- Impacto en DML y HOT:
--   - Cada INSERT debe mantener este B-tree; el costo concreto depende de la
--     carga y se controla mediante pg_stat_user_indexes y las métricas de DML.
--   - UPDATE (likes): Al ejecutar PATCH /api/resenas/:id/like, la columna 'likes'
--     se modifica. Dado que 'likes' esta indexada en este B-Tree, este UPDATE
--     NO puede beneficiarse de HOT (Heap-Only Tuples); el motor debe crear una
--     nueva version de tupla en el heap y un nuevo puntero en este indice.
-- ----------------------------------------------------------------------------
\echo '>>> Creando idx_resenas_juegoid_likes_createdat...'
CREATE INDEX IF NOT EXISTS idx_resenas_juegoid_likes_createdat 
ON resenas ("juegoId", likes DESC, "createdAt" DESC);

-- ----------------------------------------------------------------------------
-- 2. Indice Compuesto B-Tree para Validacion de Unicidad de Resena Usuario-Juego
-- Tabla: resenas (6.000.000 tuplas)
-- Columnas: ("loginId", "juegoId")
-- Justificacion Tecnica:
--   - Resuelve Consulta 3 (POST /api/resenas: findOne por loginId y juegoId).
--   - Evita el escaneo secuencial de reseñas al validar cada publicación.
--   - NOTA TECNICA SOBRE DUPLICADOS: No se define como UNIQUE porque el conjunto
--     de datos sinteticos generado en HU-06 posee repeticiones controladas para pruebas
--     (600 resenas por par usuario-juego). Un indice UNIQUE fallaria con error de clave duplicada.
--   - Satisface ademas como prefijo cualquier consulta que busque resenas por loginId solo.
-- ----------------------------------------------------------------------------
\echo '>>> Creando idx_resenas_loginid_juegoid...'
CREATE INDEX IF NOT EXISTS idx_resenas_loginid_juegoid 
ON resenas ("loginId", "juegoId");

-- ----------------------------------------------------------------------------
-- 3. Indice B-Tree de Cobertura (Covering Index) para Catalogo de Videojuegos
-- Tabla: juegos (5.000 tuplas)
-- Columnas Clave: (calificacion DESC, id ASC)
-- Columnas Payload (INCLUDE): (titulo, desarrolladora, fecha_lanzamiento, imagen_portada)
-- Justificacion Tecnica:
--   - Resuelve Consulta 4 (HU-21: WHERE calificacion BETWEEN ... ORDER BY calificacion DESC, id ASC).
--   - Las columnas bajo la clausula INCLUDE residen exclusivamente en las hojas
--     del arbol sin sobrecargar la estructura de nodos intermedios de ordenacion.
--   - Permite que PostgreSQL resuelva la consulta mediante un Index Only Scan directo,
--     sin acceder a los bloques de datos principales (heap) de la tabla juegos.
-- ----------------------------------------------------------------------------
\echo '>>> Creando idx_juegos_calificacion_id_cov...'
CREATE INDEX IF NOT EXISTS idx_juegos_calificacion_id_cov 
ON juegos (calificacion DESC, id ASC) 
INCLUDE (titulo, desarrolladora, fecha_lanzamiento, imagen_portada);

-- ----------------------------------------------------------------------------
-- 4. Indice Invertido Generalizado (GIN) Trigram para Busquedas Predictivas ILIKE
-- Tabla: juegos (5.000 tuplas)
-- Tipo: GIN con clase de operadores gin_trgm_ops
-- Columnas: (titulo gin_trgm_ops)
-- Justificacion Tecnica:
--   - Resuelve Consulta 5 (Navbar: WHERE titulo ILIKE '%Cyber%').
--   - Un indice B-tree convencional (incluso funcional o con varchar_pattern_ops)
--     es completamente incapaz de indexar patrones que inician con un comodin ('%texto%').
--   - El operador trigrama (pg_trgm) descompone las cadenas en subsecuencias de 3 caracteres,
--     permitiendo al optimizador resolver la subcadena mediante un Bitmap Index Scan.
-- ----------------------------------------------------------------------------
\echo '>>> Creando idx_juegos_titulo_trgm (GIN trigram)...'
CREATE INDEX IF NOT EXISTS idx_juegos_titulo_trgm 
ON juegos USING gin (titulo gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- 5. Indice Funcional Unico B-Tree para Autenticacion de Usuarios
-- Tabla: logins (10.000 tuplas)
-- Expresion: (LOWER(username))
-- Justificacion Tecnica:
--   - No corresponde a la consulta de login actual, que compara username por
--     igualdad exacta y utiliza idx_logins_username.
--   - Se conserva como regla de integridad: impide duplicados que sólo difieren
--     en mayúsculas/minúsculas e indexa el valor normalizado.
--   - VALIDACION DE UNICIDAD: Se verifico previamente mediante agrupacion SQL
--     que no existen duplicados en lower(username) en la base de datos (0 tuplas).
--     Por ende, es estrictamente seguro y correcto declararlo como UNIQUE,
--     garantizando integridad a nivel motor.
-- ----------------------------------------------------------------------------
\echo '>>> Creando idx_logins_lower_username (Funcional UNIQUE)...'
CREATE UNIQUE INDEX IF NOT EXISTS idx_logins_lower_username 
ON logins (LOWER(username));

-- Indice de la consulta real de login.controller.js: la aplicacion busca
-- username por igualdad exacta, por lo que un B-tree normal es el acceso
-- adecuado. No se declara UNIQUE para no alterar las reglas funcionales.
CREATE INDEX IF NOT EXISTS idx_logins_username ON logins (username);

-- ----------------------------------------------------------------------------
-- 6. Indice Compuesto B-Tree para Bitacora de Auditoria
-- Tabla: audit_logs (10.024 tuplas)
-- Columnas: (accion, fecha DESC)
-- Justificacion Tecnica:
--   - Resuelve Consulta 8 (Dashboard de Auditoria: WHERE accion = X ORDER BY fecha DESC).
--   - La clave compuesta satisface simultaneamente el filtro de igualdad y
--     la direccion cronologica descendente sin requerir ordenamiento en memoria.
-- ----------------------------------------------------------------------------
\echo '>>> Creando idx_audit_logs_accion_fecha...'
CREATE INDEX IF NOT EXISTS idx_audit_logs_accion_fecha 
ON audit_logs (accion, fecha DESC);

-- ----------------------------------------------------------------------------
-- 7. Indice Compuesto B-Tree para Telemetria y Monitoreo de Accesos
-- Tabla: accesos (10.000 tuplas)
-- Columnas: (fecha, exito)
-- Justificacion Tecnica:
--   - Resuelve Consulta 9 (Dashboard Logins por dia: WHERE fecha >= ... GROUP BY DATE(fecha)).
--   - Permite un Index Only Scan directo sobre los accesos registrados,
--     reduciendo la lectura de buffers de 154 a 7 bloques.
-- ----------------------------------------------------------------------------
\echo '>>> Creando idx_accesos_fecha_exito...'
CREATE INDEX IF NOT EXISTS idx_accesos_fecha_exito 
ON accesos (fecha, exito);

-- ----------------------------------------------------------------------------
-- Actualizacion de Estadisticas del Optimizador de Consultas
-- ----------------------------------------------------------------------------
\echo '>>> Actualizando estadisticas del Optimizador con ANALYZE...'
ANALYZE VERBOSE resenas;
ANALYZE VERBOSE juegos;
ANALYZE VERBOSE logins;
ANALYZE VERBOSE audit_logs;
ANALYZE VERBOSE accesos;

\echo '----------------------------------------------------------------------'
\echo 'FIN: Creacion de indices y actualizacion de estadisticas completada.'
\echo '----------------------------------------------------------------------'
