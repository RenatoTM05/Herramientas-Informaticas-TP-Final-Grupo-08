# Proybackendgrupo10 - Documentación Backend

## 1) Descripción general

Este proyecto es una API backend en **Node.js + Express + Sequelize + PostgreSQL** orientada a videojuegos.  
Incluye:

- autenticación local con JWT,
- autenticación OAuth con Google (Passport),
- consulta de juegos en IGDB (Twitch),
- cache local de juegos en PostgreSQL,
- sistema de reseñas con moderación por Gemini,
- auditoría de acciones y métricas para dashboards,
- documentación Swagger en `/api-docs`.

---

## 2) Stack tecnológico

- **Runtime:** Node.js
- **Framework HTTP:** Express 5
- **ORM:** Sequelize
- **Base de datos:** PostgreSQL
- **Auth:** JWT + Passport Google OAuth 2.0
- **Integraciones externas:**
  - IGDB/Twitch API
  - Google Gemini (moderación de reseñas)
  - Traducción automática con `google-translate-api-x`
- **Documentación API:** swagger-autogen + swagger-ui-express

---

## 3) Estructura del proyecto

```text
config/
  database.js              # conexión Sequelize a PostgreSQL
  passport.js              # estrategia OAuth Google

src/
  controllers/             # lógica de negocio por módulo
  middlewares/             # auth, roles, auditoría, sanitización
  models/                  # modelos Sequelize
  routes/                  # definición de endpoints
  services/                # servicios externos (IGDB, Gemini)

index.js                   # entrypoint, middlewares globales y rutas
swagger.js                 # generador de swagger-output.json
swagger-output.json        # contrato Swagger generado
```

---

## 4) Instalación y ejecución

### Requisitos

- Node.js 18+ recomendado
- PostgreSQL en ejecución local (host `localhost`)
- Base de datos creada: `tpfinalbackend`

### Pasos

```bash
npm install
npm run dev
```

### Scripts disponibles

- `npm run dev` → ejecuta servidor con nodemon.
- `npm run swagger` → regenera `swagger-output.json`.
- `npm test` → no hay tests implementados (actualmente devuelve error por diseño del script).

---

## 5) Variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development

DB_USER=postgres
DB_PASSWORD=tu_password

SESSION_SECRET=session_user
JWT_SECRET=token_pal_usuario
FRONTEND_URL=http://localhost:4200

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

IGDB_CLIENT_ID=...
IGDB_CLIENT_SECRET=...

GEMINI_API_KEY=...
GEMINI_MODERACION=true
```

### Notas importantes

- La BD usada está fija en código como `tpfinalbackend` (ver `config/database.js`).
- Si `GEMINI_MODERACION=false`, la moderación se desactiva para pruebas.
- Si no existe `GEMINI_API_KEY` y no es producción, la reseña se aprueba sin bloqueo.

---

## 6) Flujo de arranque

Al iniciar (`index.js`):

1. Carga variables de entorno.
2. Configura sesión (`express-session`) y Passport.
3. Aplica middlewares globales: JSON, CORS, sanitización XSS.
4. Publica Swagger UI en `/api-docs`.
5. Registra rutas.
6. Define relaciones Sequelize entre `Juego`, `Resena`, `Login`.
7. Ejecuta `sequelize.sync({ alter: true })`.
8. Levanta el servidor en `PORT`.

---

## 7) Seguridad y middlewares

- **`sanitize.middleware`**: limpia `req.body`, `req.query`, `req.params` con `xss`.
- **`auth.middleware`**: valida JWT usando el header Authorization con esquema Bearer.
- **`role.middlewares`**: restringe rutas administrativas a `perfil === 'admin'`.
- **`audit.middleware`**: intercepta `res.send` y registra acción, ruta, IP, status y resultado en `audit_logs`.

---

## 8) Modelos de datos

### `Login` (`logins`)
- username, password, nombre, apellido, perfil
- googleId, foto, email
- timestamps activados

### `Usuario` (`Usuarios` por defecto Sequelize)
- id autoincremental
- `loginId` (FK a Login)
- relación 1:1 con `Login`

### `Juego` (`juegos`)
- id (id de IGDB), título, descripción, portada
- plataformas, géneros, capturas, similares, DLCs, expansiones, saga (JSON)
- trailer_id, fecha_lanzamiento, calificación, desarrolladora

### `Resena` (`resenas`)
- juegoId, loginId, texto, likes
- timestamps activados

### `Acceso` (`accesos`)
- usuarioId, username, fecha, ip, userAgente, exito, error

### `AuditLog` (`audit_logs`)
- usuario, accion, metodo, ruta, ip, userAgent, fecha, statusCode, resultado

---

## 9) Integraciones externas

### IGDB/Twitch (`src/services/igdb.service.js`)

Funcionalidades:
- búsqueda por texto (`buscarJuegos`),
- más jugados (`obtenerMasJugados`),
- detalle completo por id (`obtenerDetallePorId`),
- endpoint de prueba (`testGame`).

Detalles:
- token OAuth por `client_credentials` contra Twitch,
- queries APICalypse,
- normalización de respuesta para frontend,
- traducción automática de resumen al español.

### Gemini (`src/services/gemini.service.js`)

Se usa para moderar texto de reseñas:
- rechaza insultos, discriminación, spam, amenazas, etc.
- exige respuesta JSON estructurada de aprobación/rechazo.

---

## 10) API REST (resumen por módulo)

> Base URL local: `http://localhost:3000`

### Juegos (`/juego`)

- `GET /juego/` → lista juegos guardados localmente.
- `GET /juego/mas-jugados` → top juegos de IGDB con cache en memoria (24h).
- `GET /juego/sugerencias/:nombre` → autocompletado/búsqueda por nombre.
- `GET /juego/detalle/:id` → detalle completo (lee cache local y si no existe consulta IGDB y guarda).
- `GET /juego/test/:id` → consulta extendida de prueba sobre IGDB.

### Reseñas (`/resenas`)

- `GET /resenas/juego/:juegoId` → lista reseñas de un juego, ordenadas por likes.
- `POST /resenas/` → crea reseña (requiere `juegoId`, `texto`, `loginId`).
  - valida contenido con Gemini,
  - evita duplicado de reseña por usuario/juego.
- `PATCH /resenas/:id/like` → incrementa likes.

### Auth Google (`/api/auth`)

- `GET /api/auth/google` → inicia OAuth.
- `GET /api/auth/google/callback` → procesa callback, genera JWT y redirige al frontend.
- `GET /api/auth/google/failure` → redirección de error al frontend.
- `GET /api/auth/logout` → cierra sesión Passport.

### Login local (`/api/login`)

- `POST /api/login/` → registro de usuario local.
- `POST /api/login/loginUser` → login local con JWT (expira en 2h).

### Usuarios admin (`/api/usuarios`) *(protegido con JWT + rol admin)*

- `GET /api/usuarios/` → listar usuarios.
- `GET /api/usuarios/username/:username` → obtener usuario por username.
- `PUT /api/usuarios/` → modificar usuario.
- `DELETE /api/usuarios/:id` → eliminar usuario.

### Dashboard admin (`/api/dashboard`) *(protegido con JWT + rol admin)*

- `GET /api/dashboard/metricas`
- `GET /api/dashboard/logins-por-dia`
- `GET /api/dashboard/acciones-por-tipo`
- `GET /api/dashboard/usuarios-activos`
- `GET /api/dashboard/auditoria`
- `GET /api/dashboard/juegos-buscados`

### Dashboard público de juegos (`/api/dashboardJuego`)

- `GET /api/dashboardJuego/estadisticas`

---

## 11) Documentación Swagger

- UI: `http://localhost:3000/api-docs`
- Archivo generado: `swagger-output.json`
- Generación manual:

```bash
npm run swagger
```

---

