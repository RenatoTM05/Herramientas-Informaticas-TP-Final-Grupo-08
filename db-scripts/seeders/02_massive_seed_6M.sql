
-- =========================================================================
-- Archivo: 02_massive_seed_6M.sql
-- Descripción: Carga masiva optimizada con 6 millones de reseñas y datos
--              sintéticos variados para el sistema de videojuegos.
-- =========================================================================

-- Optimización de la carga:
-- Desactiva la espera de confirmación de escritura en cada transacción.
-- No desactiva las restricciones de integridad ni las claves foráneas.
SET synchronous_commit = OFF;

-- =========================================================================
-- 1. JUEGOS (5.000 registros)
-- =========================================================================

INSERT INTO juegos (
    id,
    titulo,
    descripcion,
    imagen_portada,
    plataformas,
    generos,
    trailer_id,
    fecha_lanzamiento,
    calificacion,
    desarrolladora,
    capturas,
    juegos_similares,
    dlcs,
    expansiones,
    saga,
    "createdAt",
    "updatedAt"
)
SELECT
    i,
    franquicia || ' ' || subtitulo || ' ' || i,
    'Explorá ' || franquicia || ' ' || subtitulo ||
    ', una experiencia de ' || genero ||
    ' ambientada en un universo lleno de desafíos. ' ||
    'Desarrollá nuevas estrategias, descubrí escenarios y completá ' ||
    'misiones mientras avanzás en esta aventura.',
    'https://placehold.co/264x352/1f2937/ffffff/png?text=' ||
        replace(franquicia, ' ', '+'),
    json_build_array(
        plataforma1,
        plataforma2
    ),
    json_build_array(
        genero,
        genero2
    ),
    CASE
        WHEN i % 4 = 0 THEN 'dQw4w9WgXcQ'
        ELSE NULL
    END,
    (2000 + (i % 25))::TEXT || '-' ||
        LPAD((1 + (i % 12))::TEXT, 2, '0') || '-' ||
        LPAD((1 + (i % 28))::TEXT, 2, '0'),
    50 + ((i * 37) % 51),
    desarrolladora,
    json_build_array(
        'https://placehold.co/1280x720/1e293b/ffffff/png?text=Captura+' || i,
        'https://placehold.co/1280x720/334155/ffffff/png?text=Gameplay+' || i
    ),
    json_build_array(
        json_build_object(
            'id', 1 + (i % 5000),
            'titulo', 'Juego recomendado ' || (1 + (i % 5000)),
            'imagen_portada', 'https://placehold.co/264x352/png?text=Similar'
        )
    ),
    CASE
        WHEN i % 3 = 0 THEN
            json_build_array(
                json_build_object('nombre', 'Contenido adicional ' || i)
            )
        ELSE '[]'::JSON
    END,
    CASE
        WHEN i % 5 = 0 THEN
            json_build_array(
                json_build_object('nombre', 'Expansión ' || i)
            )
        ELSE '[]'::JSON
    END,
    json_build_object(
        'nombre', franquicia,
        'entrega', i
    ),
    NOW() - ((i % 1000) * INTERVAL '1 day'),
    NOW()
FROM (
    SELECT
        i,
        (ARRAY[
            'Fallout', 'Cyber', 'Shadow', 'Final', 'Star',
            'Dark', 'Legend of', 'Apex', 'Dragon', 'Silent',
            'Resident', 'Grand', 'Metal', 'God of', 'Elder',
            'Horizon', 'Mass', 'Dead', 'Battle', 'Tomb'
        ])[1 + (i % 20)] AS franquicia,

        (ARRAY[
            'Chronicles', 'Protocol', 'Odyssey', 'Strike', 'Arena',
            'Universe', 'Saga', 'Legacy', 'Combat', 'Evolution',
            'Frontier', 'Origins', 'Reborn', 'Awakening', 'Revolution',
            'Rising', 'Destiny', 'Remastered', 'Reckoning', 'Beyond',
            'Legends', 'Origins II', 'Infinity', 'Survivors', 'Ascension'
        ])[1 + ((i / 20) % 25)] AS subtitulo,

        (ARRAY[
            'Ubisoft', 'Bethesda', 'Electronic Arts', 'Valve',
            'CD Projekt Red', 'Nintendo', 'Sony Interactive',
            'Square Enix', 'Capcom', 'Bandai Namco',
            'Rockstar Games', 'Riot Games'
        ])[1 + ((i * 7 + i / 17) % 12)] AS desarrolladora,

        (ARRAY[
            'PC', 'PlayStation 5', 'Xbox Series X',
            'Nintendo Switch', 'PlayStation 4'
        ])[1 + (i % 5)] AS plataforma1,

        (ARRAY[
            'PC', 'Xbox Series X', 'PlayStation 5',
            'Nintendo Switch', 'Xbox One'
        ])[1 + ((i * 3 + 1) % 5)] AS plataforma2,

        (ARRAY[
            'Acción', 'Aventura', 'RPG', 'Estrategia',
            'Supervivencia', 'Deportes', 'Terror',
            'Simulación', 'Mundo abierto', 'Plataformas'
        ])[1 + (i % 10)] AS genero,

        (ARRAY[
            'Acción', 'Aventura', 'RPG', 'Estrategia',
            'Supervivencia', 'Deportes', 'Terror',
            'Simulación', 'Carreras', 'Indie'
        ])[1 + ((i * 3 + 2) % 10)] AS genero2
    FROM generate_series(1, 5000) AS gs(i)
) AS datos;

-- =========================================================================
-- 2. LOGINS (10.000 registros)
-- =========================================================================

INSERT INTO logins (
    username,
    password,
    nombre,
    apellido,
    perfil,
    "googleId",
    foto,
    email,
    "createdAt",
    "updatedAt"
)
SELECT
    'gamer_' || i,

    -- Hash bcrypt de ejemplo para la contraseña "password".
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',

    (ARRAY[
        'Mateo', 'Sofia', 'Lucas', 'Valentina', 'Santiago',
        'Martina', 'Benjamin', 'Lucia', 'Joaquin', 'Catalina',
        'Tomas', 'Camila', 'Nicolas', 'Agustina', 'Franco'
    ])[1 + (i % 15)],

    (ARRAY[
        'Gonzalez', 'Rodriguez', 'Lopez', 'Martinez', 'Perez',
        'Gomez', 'Sanchez', 'Diaz', 'Alvarez', 'Romero',
        'Torres', 'Ruiz', 'Fernandez', 'Acosta', 'Benitez'
    ])[1 + ((i * 7) % 15)],

    CASE
        WHEN i = 1 THEN 'admin'
        WHEN i BETWEEN 2 AND 20 THEN 'moderador'
        ELSE 'usuario'
    END,

    CASE
        WHEN i % 5 = 0 THEN 'google_token_id_' || i
        ELSE NULL
    END,

    'https://api.dicebear.com/9.x/avataaars/svg?seed=gamer_' || i,

    'player_' || i || '@gamemail.com',

    NOW() - ((i % 500) * INTERVAL '1 day'),
    NOW()
FROM generate_series(1, 10000) AS gs(i);

-- =========================================================================
-- 3. USUARIOS (10.000 registros)
-- =========================================================================

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

-- =========================================================================
-- 4. RESENAS (6.000.000 registros)
-- =========================================================================

INSERT INTO resenas (
    "juegoId",
    "loginId",
    texto,
    likes,
    "createdAt",
    "updatedAt"
)
SELECT
        1 + ((i::BIGINT * 7919) % 5000),
        1 + ((i::BIGINT * 3571) % 10000),

    (ARRAY[
        'La experiencia de juego es excelente. Los escenarios y la jugabilidad hacen que valga la pena dedicarle horas.',
        'Me gustó mucho la historia y el desarrollo de los personajes. Tiene algunos detalles para mejorar, pero lo recomiendo.',
        'Un título muy entretenido. Su sistema de progresión y sus mecánicas mantienen el interés durante toda la partida.',
        'La ambientación está muy bien lograda y la banda sonora acompaña perfectamente. Es uno de los puntos más fuertes.',
        'Tiene buenas ideas y bastante contenido. Algunas misiones podrían ser más variadas, pero en general cumple.',
        'Lo empecé sin demasiadas expectativas y terminó sorprendiéndome. Muy recomendable para los amantes del género.',
        'Gráficamente es muy atractivo y ofrece una buena variedad de escenarios. El rendimiento podría mejorar.',
        'Un juego que recompensa la exploración y la experimentación. Tiene mucho contenido para descubrir.',
        'Me gustó especialmente el diseño de niveles y la libertad que ofrece para resolver cada situación.',
        'La dificultad está bien equilibrada y las mecánicas son fáciles de aprender, aunque difíciles de dominar.',
        'Después de varias horas sigo encontrando cosas nuevas. Es una experiencia muy completa.',
        'El modo de juego es divertido y tiene buenas posibilidades. Lo recomiendo para jugar con amigos.',
        'La historia tiene momentos interesantes y los personajes están bien desarrollados.',
        'Tiene algunos problemas técnicos, pero su propuesta general es muy buena.',
        'Excelente relación entre contenido y duración. Es fácil perder la noción del tiempo jugando.',
        'Me gustó la variedad de habilidades y opciones disponibles. Permite experimentar diferentes estrategias.',
        'La dirección artística es uno de sus mayores atractivos. Los escenarios tienen mucha personalidad.',
        'Es entretenido, aunque algunas partes se sienten repetitivas. Aun así, merece una oportunidad.',
        'Una propuesta sólida que combina buenas mecánicas con una ambientación interesante.',
        'Lo recomiendo especialmente a quienes disfrutan de los desafíos y la exploración.'
    ])[1 + ((i * 13) % 20)] ||
    ' Comentario de jugador #' || i || '.',

    ((i::BIGINT * 17) % 301)::INTEGER,

    NOW() - (((i::BIGINT * 7919) % 31536000) * INTERVAL '1 second'),
    NOW()
FROM generate_series(1, 6000000) AS gs(i);

-- =========================================================================
-- 5. ACCESOS (10.000 registros)
-- =========================================================================

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
    1 + (i % 10000),
    'gamer_' || (1 + (i % 10000)),
    NOW() - ((i % 60) * INTERVAL '1 day'),
    '192.168.' || (1 + (i % 254)) || '.' || (1 + ((i * 7) % 254)),
    CASE
        WHEN i % 3 = 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        WHEN i % 3 = 1 THEN 'Mozilla/5.0 (X11; Linux x86_64)'
        ELSE 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'
    END,
    (i % 5 <> 0),
    CASE
        WHEN i % 5 = 0 THEN 'Error de autenticacion'
        ELSE NULL
    END
FROM generate_series(1, 10000) AS gs(i);

-- =========================================================================
-- 6. AUDIT_LOGS (10.000 registros)
-- =========================================================================

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
    'gamer_' || (1 + (i % 10000)),

    CASE (i % 5)
        WHEN 0 THEN 'CREAR_RESENA'
        WHEN 1 THEN 'ELIMINAR_FAVORITO'
        WHEN 2 THEN 'CONSULTAR_JUEGO'
        WHEN 3 THEN 'BUSCAR_JUEGO'
        ELSE 'INICIAR_SESION'
    END,

    CASE
        WHEN i % 5 IN (0, 1) THEN 'POST'
        ELSE 'GET'
    END,

    CASE (i % 4)
        WHEN 0 THEN '/api/juegos/detalles/' || (1 + (i % 5000))
        WHEN 1 THEN '/api/resenas/' || (1 + (i % 5000))
        WHEN 2 THEN '/api/juegos/buscar'
        ELSE '/api/login'
    END,

    '10.0.' || (1 + (i % 254)) || '.' || (1 + ((i * 3) % 254)),

    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',

    NOW() - ((i % 30) * INTERVAL '1 day'),

    CASE
        WHEN i % 20 = 0 THEN 404
        WHEN i % 25 = 0 THEN 500
        ELSE 200
    END,

    CASE
        WHEN i % 20 = 0 THEN '{"status":"not_found"}'
        WHEN i % 25 = 0 THEN '{"status":"error"}'
        ELSE '{"status":"success"}'
    END
FROM generate_series(1, 10000) AS gs(i);

-- =========================================================================
-- 7. ACTUALIZACIÓN DE ESTADÍSTICAS
-- =========================================================================

ANALYZE juegos;
ANALYZE logins;
ANALYZE "Usuarios";
ANALYZE resenas;
ANALYZE accesos;
ANALYZE audit_logs;

-- =========================================================================
-- FIN DE LA CARGA MASIVA
-- Total esperado: 6.045.000 registros
-- =========================================================================
