
-- =========================================================================
-- Archivo: 02_massive_seed_6M.sql
-- Descripción: Carga masiva con datos simulados realistas
-- =========================================================================

SET maintenance_work_mem = '512MB';
SET synchronous_commit = OFF;

-- 1. Poblar catálogo de juegos (5.000 registros)
INSERT INTO juegos (
    id,
    titulo,
    descripcion,
    calificacion,
    desarrolladora,
    "createdAt",
    "updatedAt"
)
SELECT
    i AS id,
    (ARRAY[
        'Cyber', 'Shadow', 'Final', 'Super', 'Legend of',
        'Apex', 'Star', 'Dark', 'Fallout', 'Rocket'
    ])[1 + (i % 10)] || ' ' ||
    (ARRAY[
        'Chronicles', 'Protocol', 'Odyssey', 'Strike', 'Arena',
        'Universe', 'Saga', 'Legacy', 'Combat', 'Evo'
    ])[1 + ((i / 10) % 10)] || ' ' || i AS titulo,
    'Descripción oficial del videojuego extraída desde la integración con la API de IGDB para el catálogo global.',
    (60 + (random() * 40))::INT,
    (ARRAY[
        'EA Sports', 'Ubisoft', 'Valve', 'CD Projekt', 'Nintendo',
        'Sony Interactive', 'Riot Games', 'Square Enix', 'Capcom', 'Bethesda'
    ])[1 + (i % 10)],
    NOW() - (random() * INTERVAL '1000 days'),
    NOW()
FROM generate_series(1, 5000) AS i;

-- 2. Poblar logins (100.000 registros)
INSERT INTO logins (
    username,
    password,
    nombre,
    apellido,
    perfil,
    "googleId",
    email,
    "createdAt",
    "updatedAt"
)
SELECT
    'gamer_' || i,
    '$2b$10$EpVqVv0g9xL7p8Y5z6x3.O5K8q7Z1v2N3m4L5k6J7h8G9f0E1d2C3',
    (ARRAY[
        'Mateo', 'Sofía', 'Lucas', 'Valentina', 'Santiago',
        'Martina', 'Benjamín', 'Lucía', 'Joaquín', 'Catalina'
    ])[1 + (i % 10)],
    (ARRAY[
        'González', 'Rodríguez', 'López', 'Martínez', 'Pérez',
        'Gómez', 'Sánchez', 'Díaz', 'Álvarez', 'Romero'
    ])[1 + ((i / 10) % 10)],
    CASE
        WHEN i = 1 THEN 'admin'
        WHEN i BETWEEN 2 AND 50 THEN 'moderador'
        ELSE 'usuario'
    END,
    CASE
        WHEN i % 10 = 0 THEN 'google_token_id_' || i
        ELSE NULL
    END,
    'player_' || i || '@gamemail.com',
    NOW() - (random() * INTERVAL '500 days'),
    NOW()
FROM generate_series(1, 100000) AS i;

-- 3. Poblar perfiles extendidos (100.000 registros)
INSERT INTO "Usuarios" (
    "loginId",
    "createdAt",
    "updatedAt"
)
SELECT
    id,
    NOW(),
    NOW()
FROM logins;

-- 4. Poblar reseñas (5.800.000 registros)
INSERT INTO resenas (
    "juegoId",
    "loginId",
    texto,
    likes,
    "createdAt",
    "updatedAt"
)
SELECT
    1 + (floor(random() * 5000))::INT,
    1 + (i % 100000),
    (ARRAY[
        'Excelente jugabilidad y gráficos impresionantes, totalmente recomendado.',
        'La historia me atrapó desde el primer minuto, aunque tiene algunos bugs menores.',
        'Muy buen título multijugador para pasar horas con amigos.',
        'Esperaba más de la optimización en PC, pero la banda sonora lo salvan todo.',
        'Una obra maestra moderna de la industria de los videojuegos.'
    ])[1 + (i % 5)],
    (random() * 300)::INT,
    NOW() - (random() * INTERVAL '365 days'),
    NOW()
FROM generate_series(1, 5800000) AS i;

-- 5. Poblar accesos (50.000 registros)
INSERT INTO accesos (
    "usuarioId",
    username,
    fecha,
    ip,
    "userAgente",
    exito,
    error
)
SELECT
    1 + (i % 100000),
    'gamer_' || (1 + (i % 100000)),
    NOW() - (random() * INTERVAL '60 days'),
    '192.168.1.' || (i % 255),
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    (i % 5 <> 0),
    CASE
        WHEN i % 5 = 0 THEN 'Error de autenticación'
        ELSE NULL
    END
FROM generate_series(1, 50000) AS i;

-- 6. Poblar logs de auditoría (45.000 registros)
INSERT INTO audit_logs (
    usuario,
    accion,
    metodo,
    ruta,
    ip,
    "userAgent",
    fecha,
    "statusCode",
    resultado
)
SELECT
    'gamer_' || (1 + (i % 100000)),
    CASE (i % 3)
        WHEN 0 THEN 'CREAR_RESEÑA'
        WHEN 1 THEN 'ELIMINAR_FAVORITO'
        ELSE 'CONSULTAR_JUEGO'
    END,
    CASE (i % 2)
        WHEN 0 THEN 'POST'
        ELSE 'GET'
    END,
    '/api/juegos/detalles/' || (1 + (i % 5000)),
    '10.0.0.' || (i % 255),
    'PostmanRuntime/7.29.2',
    NOW() - (random() * INTERVAL '30 days'),
    CASE
        WHEN i % 20 = 0 THEN 404
        ELSE 200
    END,
    '{"status": "success"}'
FROM generate_series(1, 45000) AS i;

-- 7. Restablecer configuración de confirmación
SET synchronous_commit = ON;

-- 8. Actualizar estadísticas para el optimizador
ANALYZE juegos;
ANALYZE logins;
ANALYZE "Usuarios";
ANALYZE resenas;
ANALYZE accesos;
ANALYZE audit_logs;
