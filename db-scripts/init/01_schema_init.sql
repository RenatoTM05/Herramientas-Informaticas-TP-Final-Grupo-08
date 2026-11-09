
-- =========================================================================
-- Archivo: 01_schema_init.sql
-- Descripción: DDL de inicialización basado en los modelos reales de Sequelize
-- =========================================================================

-- Eliminar tablas en orden inverso para evitar conflictos de FK
DROP TABLE IF EXISTS resenas CASCADE;
DROP TABLE IF EXISTS "Usuarios" CASCADE;
DROP TABLE IF EXISTS logins CASCADE;
DROP TABLE IF EXISTS juegos CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS accesos CASCADE;

-- 1. Tabla de Logins (Usuarios del sistema / Autenticación)
CREATE TABLE logins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    perfil VARCHAR(255) NOT NULL,
    "googleId" VARCHAR(255) UNIQUE,
    foto VARCHAR(255),
    email VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios (Perfil extendido vinculado a Login)
CREATE TABLE "Usuarios" (
    id SERIAL PRIMARY KEY,
    "loginId" INT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_login_usuario FOREIGN KEY ("loginId")
        REFERENCES logins(id) ON DELETE CASCADE
);

-- 3. Tabla de Juegos (Catálogo de IGDB)
CREATE TABLE juegos (
    id INT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_portada VARCHAR(255),
    plataformas JSON,
    generos JSON,
    trailer_id VARCHAR(255),
    fecha_lanzamiento VARCHAR(255),
    calificacion INT,
    desarrolladora VARCHAR(255),
    capturas JSON,
    juegos_similares JSON,
    dlcs JSON,
    expansiones JSON,
    saga JSON,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Reseñas
CREATE TABLE resenas (
    id SERIAL PRIMARY KEY,
    "juegoId" INT NOT NULL,
    "loginId" INT NOT NULL,
    texto TEXT NOT NULL,
    likes INT DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resena_juego FOREIGN KEY ("juegoId")
        REFERENCES juegos(id) ON DELETE CASCADE,
    CONSTRAINT fk_resena_login FOREIGN KEY ("loginId")
        REFERENCES logins(id) ON DELETE CASCADE
);

-- 5. Tabla de Accesos
CREATE TABLE accesos (
    id SERIAL PRIMARY KEY,
    "usuarioId" INT,
    username VARCHAR(255) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(255),
    "userAgente" VARCHAR(255),
    exito BOOLEAN NOT NULL DEFAULT FALSE,
    error VARCHAR(255)
);

-- 6. Tabla de Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    accion VARCHAR(255) NOT NULL,
    metodo VARCHAR(255) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    ip VARCHAR(255) NOT NULL,
    "userAgent" VARCHAR(255) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INT NOT NULL,
    resultado TEXT NOT NULL
);
