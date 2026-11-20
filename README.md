# Red Social Gamer y Catálogo de Videojuegos · Grupo 08

Aplicación web académica para descubrir videojuegos, consultar sus detalles y compartir reseñas. El proyecto integra un frontend Angular, una API Express y una plataforma reproducible con PostgreSQL de alta disponibilidad, monitoreo, copias de seguridad y servicios de soporte.

## Funcionalidades

- Catálogo con juegos destacados, búsqueda, sugerencias, filtros y vista de detalle.
- Registro e inicio de sesión con usuario y contraseña; acceso con Google OAuth cuando se configuran sus credenciales.
- Reseñas con paginación y reacciones. El backend puede moderar texto con Gemini cuando se configura su clave.
- Panel administrativo con métricas, auditoría y exportación a Excel y PDF.
- API REST documentada con Swagger UI.
- Stack de operación con PostgreSQL 16, Patroni y etcd, entrada SQL mediante HAProxy, copias de seguridad, Prometheus, Grafana y Alertmanager. Compose también incluye pgAdmin, GLPI, Nextcloud, n8n y acceso remoto opcional con Tailscale Funnel.

El frontend incluye pantallas y servicios de pago para Mercado Pago Sandbox; el backend de esta revisión no registra rutas de pago, por lo que ese flujo aún no está integrado de punta a punta. La configuración opcional de servicios externos y las limitaciones conocidas están detalladas en [informe-general.md](informe-general.md).

## Tecnologías

- **Frontend:** Angular 21, TypeScript, Bootstrap, RxJS y Chart.js.
- **Backend:** Node.js 22, Express 5, Sequelize y Swagger.
- **Datos:** PostgreSQL 16, Patroni, etcd y HAProxy.
- **Operación:** Docker Compose, GitHub Actions, Prometheus, Grafana y Alertmanager.

## Requisitos

- Docker Desktop con contenedores Linux y Docker Compose v2, o Docker Engine con el complemento Compose v2.
- Git y espacio suficiente para imágenes, tres nodos de base de datos y datos de prueba. La carga inicial incluye seis millones de reseñas y puede demorar y consumir varios GB.
- Credenciales de servicios externos solo para las funciones que las necesiten: Google OAuth, IGDB/Twitch y Gemini.

## Inicio rápido con Docker Compose

Desde PowerShell en la raíz del repositorio:

```powershell
Copy-Item .env.example .env
```

Editá `.env` y reemplazá las contraseñas de ejemplo y los secretos de sesión, JWT y n8n por valores propios. Configurá la contraseña PostgreSQL y la de replicación. Las credenciales de Google, IGDB/Twitch, Gemini y Tailscale son opcionales para el arranque básico, pero habilitan sus integraciones. No compartas ni subas `.env` al repositorio.

Validá la configuración y levantá el stack:

```powershell
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 900
docker compose ps -a
```

El primer inicio inicializa el clúster y ejecuta el esquema, la carga sintética y los índices. Consultá los logs si los servicios de base de datos, API o frontend aún no están saludables:

```powershell
docker compose logs --tail 50 pg-node-1 backend frontend
```

La aplicación queda disponible en [http://localhost:4200](http://localhost:4200). La API y su documentación están en [http://localhost:3000/api-docs](http://localhost:3000/api-docs). Otros servicios locales, con sus puertos configurables en `.env`:

| Servicio | Dirección predeterminada |
|---|---|
| pgAdmin | `http://127.0.0.1:5050` |
| GLPI | `http://localhost:8080` |
| Nextcloud | `http://localhost:8085` |
| Grafana | `http://localhost:3001` |
| Prometheus | `http://127.0.0.1:9090` |
| Alertmanager | `http://127.0.0.1:9093` |
| n8n | `http://127.0.0.1:5678` |
| PostgreSQL por HAProxy | `127.0.0.1:5433` |

Las credenciales iniciales de servicios auxiliares se definen en `.env.example`; cambialas antes de usar el entorno. GLPI, Nextcloud y n8n pueden requerir pasos de configuración o importación de flujos. Consultá el informe para sus procedimientos, el acceso externo y los resultados de verificación.

Para detener contenedores sin borrar datos:

```powershell
docker compose stop
```

`docker compose down` también conserva los volúmenes. Evitá `docker compose down -v` si querés preservar bases de datos, configuración y copias de seguridad.

## Desarrollo local de frontend y backend

También se pueden ejecutar ambos proyectos fuera de Docker. Requiere Node.js 22 y PostgreSQL accesible desde el host. El backend espera por defecto `tpfinalbackend` en `localhost:5432`; creá la base y definí `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT` en `backend/.env` según tu instalación. Las credenciales opcionales se describen en `.env.example`.

Terminal 1:

```powershell
Set-Location backend
npm install
npm run dev
```

Terminal 2:

```powershell
Set-Location frontend
npm install --legacy-peer-deps
npm start
```

El frontend local usa `http://localhost:4200` y el backend `http://localhost:3000`. Para la configuración y el contrato de la API, consultá los README de [backend](backend/README.md) y [frontend](frontend/README.md).

## Estructura del repositorio

```text
backend/          API Express, modelos, controladores y documentación Swagger
frontend/         Aplicación Angular
db-scripts/       Esquema, carga de prueba, índices, clúster y backups
monitoring/       Prometheus, Alertmanager y provisión de Grafana
glpi/             Configuración y respaldo de mesa de ayuda
nextcloud/        Configuración y respaldo documental
docs/             Historias de usuario, pruebas y evidencias
docker-compose.yml
.env.example      Plantilla de configuración sin secretos personales
informe-general.md
```

## Documentación

- [Informe técnico general](informe-general.md)
- [Documentación del backend](backend/README.md)
- [Documentación del frontend](frontend/README.md)
- [Configuración de ejemplo](.env.example)
