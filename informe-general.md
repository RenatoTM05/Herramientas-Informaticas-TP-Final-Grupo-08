# Informe técnico unificado · Grupo 08

**Práctica Integradora Final 2026 · Herramientas Informáticas Avanzadas**

- **Proyecto** — Red Social Gamer y Catálogo de Videojuegos con Moderación Asistida por IA.
- **Historia de usuario** — HU-20 · Documentación y defensa oral.
- **Corte técnico** — 19 de noviembre de 2026. Integración `develop` en `173477b` y análisis de seguridad HU-19 en `8a4d333`.

El informe reúne los 16 apartados técnicos del enunciado `HIA-2026-TP-FINAL.pdf`, provisto por la cátedra. La [matriz de entregables](#matriz-de-entregables-de-la-cátedra) relaciona los 15 puntos de la consigna con los capítulos, archivos y pruebas. Las mediciones se atribuyen al entorno y a la prueba que las produjo. Cuando la evidencia disponible es parcial, se indica qué verificación falta y cómo obtenerla.

## 1. Descripción de la aplicación

La aplicación académica permite descubrir videojuegos, buscar títulos por filtros, consultar detalles y publicar reseñas. El equipo incorporó una base de catálogo local para hacer las consultas habituales sobre PostgreSQL y diseñó un entorno reproducible que también permite operar y observar la aplicación.

| Módulo | Alcance en la versión revisada |
|---|---|
| Identidad | Alta e inicio de sesión local, contraseñas hasheadas con bcrypt, acceso federado con Google mediante Passport y autorización con JWT. Las rutas del panel administrativo verifican el rol en el backend. |
| Catálogo | Búsqueda, sugerencias, filtros, destacados y detalle. PostgreSQL hospeda el catálogo de prueba y el servicio IGDB/Twitch aporta metadatos externos donde corresponde. |
| Comunidad | Lectura paginada, publicación de reseñas y reacciones. El backend consulta Gemini para moderar contenido antes de guardarlo. Las escrituras de reseñas requieren el endurecimiento de autorización descrito en el capítulo 14. |
| Pagos | El cliente Angular contiene el servicio de preferencia y confirmación y la pantalla de retorno prevista para Mercado Pago Sandbox. El backend revisado carece de rutas de pagos registradas. La integración queda fuera del recorrido funcional acreditado. |
| Administración | Tablero con Chart.js, estadísticas de uso, auditoría paginada, creación de juegos y utilidades de exportación a PDF y Excel. |
| Trazabilidad | Registros de login, acceso y auditoría, middleware de sanitización y contrato OpenAPI servido mediante Swagger UI. La auditoría se almacena en PostgreSQL y comparte su dominio administrativo. |

El diagnóstico original de la HU-01 planteó desacoplar la ejecución de la configuración local, introducir un dataset de volumen, tratar la caída del servidor de base, automatizar verificaciones y agregar telemetría. El equipo incorporó Compose y variables de entorno, esquema y seed sintético, Patroni con HAProxy, GitHub Actions, y Prometheus con Grafana. Los capítulos 4 a 15 relacionan cada cambio con su validación. [Diagnóstico original de la HU-01](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08/blob/551e6455b7a653b2e87a9e60b63bcdc9cac41476/informe-general.md)

Fuentes del producto. [Frontend y rutas](frontend/src/app/app.routes.ts) · [Entrada de Express](backend/index.js) · [Integración full-stack](docs/historias_usuario/HU21-integracion-full-stack.md) · [Cliente de pagos](frontend/src/app/services/pago.ts)

## 2. Arquitectura general

### Arquitectura inicial

~~~mermaid
flowchart LR
    B["Navegador"] --> A["Angular local"]
    A --> E["API Express local"]
    E --> P[("PostgreSQL único")]
    E --> G["Google OAuth"]
    E --> I["IGDB / Twitch"]
    E --> M["Gemini"]
~~~

### Arquitectura integrada

~~~mermaid
flowchart LR
    B["Navegador externo"] -->|HTTPS| T["Tailscale Funnel"]
    BL["Navegador local"] -->|HTTP| N
    T --> N

    subgraph APP["app-network"]
        N["Nginx · frontend Angular"] -->|HTTP / proxy inverso| E["Express · backend"]
    end

    subgraph DB["db-network"]
        H["HAProxy · postgres:5432"] -->|SQL al primario| P["PostgreSQL 16 + Patroni · 3 nodos"]
        PG["pgAdmin"] --> H
        BK["Servicio de backups"] --> H
        X["postgres_exporter"] --> H
    end

    E --> H
    E --> API["Google OAuth · IGDB/Twitch · Gemini"]
    P <-->|Elección y estado en cluster-control| ET[("etcd · 3 miembros")]
    BK --> V[("backup-data")]

    subgraph MON["monitoring-network"]
        PR["Prometheus"] --> AM["Alertmanager"]
        GR["Grafana"] --> PR
        PR --> EX["node_exporter y cAdvisor"]
    end

    PR --> X
    PR -->|Métricas| P
    PR -->|Métricas| H
    AM --> W["n8n · varias redes"]
    W --> PR
    V -->|Montaje de lectura| W
    W --> G["GLPI · glpi-network"]
    G --> GM[("MariaDB")]
    W --> NC["Nextcloud · nextcloud-network"]
    NC --> NP[("PostgreSQL documental")]
    W -->|Reporte| API
~~~

Nginx sirve los estáticos y actúa como proxy inverso del mismo origen. El navegador llama a la API mediante rutas relativas. Nginx reenvía `/api/`, `/juego`, `/resenas` y `/api-docs`. Esto conserva un único origen desde el túnel y evita que la interfaz dependa de la dirección interna del backend. La convivencia de una ruta Angular bajo `/juego` y el prefijo del proxy requiere validación de accesos directos. El límite se detalla en el capítulo 16.

La segmentación separa tránsito web, SQL, coordinación del clúster, sistemas de soporte y monitoreo. Los servicios con más de una interfaz, como Express, Prometheus y n8n, cruzan esos límites donde lo requiere el flujo. El detalle de las redes y los puertos publicados está en los capítulos 4, 5 y 10.

[Compose oficial](docker-compose.yml) · [Proxy Nginx](frontend/nginx.conf) · [Configuración del túnel](tailscale/serve.json)

## 3. Inventario tecnológico

En las librerías se indica la versión resuelta por los lockfiles. En los servicios se indica la etiqueta fijada en Compose o el Dockerfile. Las etiquetas flotantes requieren registrar la versión efectiva y el digest del entorno de defensa para repetir exactamente esa instalación.

| Capa | Tecnología y versión | Uso |
|---|---|---|
| Cliente web | Angular y Angular CLI 21.2.17, TypeScript 5.9.3, RxJS 7.8.2 | SPA, rutas, formularios, servicios HTTP e interceptores. |
| Interfaz | Bootstrap 5.3.8 y SweetAlert2 11.26.25 | Estilos, componentes y mensajes al usuario. |
| Datos y reportes en cliente | Chart.js 4.5.1, ng2-charts 10.0.0, SheetJS 0.18.5, jsPDF 4.2.1 y AutoTable 5.0.8 | Gráficos y exportaciones. |
| Ejecución web | `node:22-alpine` para compilación y API, `nginx:alpine` para servir la SPA | Instalación determinista con `npm ci` y ejecución en imágenes separadas. |
| API y datos | Express 5.2.1, Sequelize 6.37.8, pg 8.22.0, Swagger UI Express 5.0.1 | REST, consultas, conexión PostgreSQL y documentación. |
| Identidad y entradas | Passport 0.7.0, estrategia Google 2.0.0, express-session 1.19.0, jsonwebtoken 9.0.3, bcrypt 6.0.0, bcryptjs 3.0.3, xss 1.0.15 | OAuth, sesiones, JWT, hash y sanitización. |
| Servicios externos | Axios 1.18.1, SDK Gemini 0.24.1, google-translate-api-x 10.7.3 | Consumo de IGDB/Twitch, moderación y traducción. |
| Base operativa y coordinación | `postgres:16-bookworm`, Patroni 4.1.5, etcd v3.6.6, HAProxy 3.2 Alpine | Datos, replicación, elección de líder y entrada SQL. PostgreSQL 16.15 es la versión registrada en la prueba HU-08. |
| Administración de datos | `dpage/pgadmin4:latest` | Cliente PostgreSQL con conexión predefinida. |
| Monitoreo | Prometheus v2.51.0, Alertmanager v0.27.0, Grafana 10.4.0, node_exporter v1.7.0, cAdvisor 0.60.6, postgres_exporter v0.15.0 | Recolección, visualización y despacho de alertas. |
| Mesa de ayuda | `glpi/glpi:latest`, MariaDB 10.11 | Formularios, incidencias, solicitudes y trazabilidad. |
| Gestión documental | `nextcloud:apache`, `postgres:16-alpine` | Archivos, permisos y WebDAV, con base dedicada. |
| Acceso público y automatización | `tailscale/tailscale:latest`, `docker.n8n.io/n8nio/n8n:latest` | Funnel HTTPS y orquestación operativa. |
| Pruebas y entrega | Node.js 22 en CI, Vitest 4.1.9, jsdom 28.1.0, GitHub Actions, Docker Buildx y GHCR | Verificación de código, pruebas, imágenes etiquetadas y publicación en el registro. |

[Lockfile de Angular](frontend/package-lock.json) · [Lockfile de Express](backend/package-lock.json) · [Imagen de Patroni](db-scripts/cluster/Dockerfile) · [Imágenes declaradas en Compose](docker-compose.yml)

## 4. Manual de instalación y ejecución

### Preparación del host

El entorno documentado utiliza Docker Desktop con contenedores Linux en Windows y PowerShell. En Linux se necesita Docker Engine con el complemento Compose v2. Las ayudas de failover y monitoreo usan PowerShell. Las métricas de disco y los montajes de cAdvisor dependen de la plataforma y se verifican al cambiar de host. Prever espacio para tres copias de los datos, WAL, imágenes y respaldos. La HU-08 midió 1.595 MB solo para la tabla `resenas` con sus índices en un nodo. El repositorio no establece un mínimo de CPU, RAM y disco validado con el stack completo.

### Obtención y configuración

~~~powershell
git clone --branch develop https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08.git
Set-Location Herramientas-Informaticas-TP-Final-Grupo-08
docker version
docker compose version
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
~~~

Configurar el archivo raíz `.env` con valores propios. PostgreSQL y Patroni usan `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `PATRONI_REPLICATION_PASSWORD`. Express reutiliza los datos del motor por Compose y requiere valores propios para `JWT_SECRET` y `SESSION_SECRET`. Completar las credenciales de pgAdmin, GLPI/MariaDB, Nextcloud y Grafana, además de `N8N_ENCRYPTION_KEY`. Conservar la clave de cifrado de n8n junto con un respaldo protegido de su almacenamiento. Completar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, las variables IGDB y `GEMINI_API_KEY` para las funciones que las usan. El registro de Funnel se configura mediante `TS_AUTHKEY` y la política del tailnet. Usar `.env.example` como inventario de nombres. Registrar la URL de callback en Google para el origen seleccionado y verificar que coincida con el retorno de la aplicación.

### Arranque y verificación

~~~powershell
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 900
docker compose ps -a
docker compose exec -T pg-node-1 patronictl -c /etc/patroni.yml list
docker compose logs --tail 25 backend backups
Invoke-WebRequest http://localhost:4200/
Invoke-RestMethod 'http://localhost:4200/juego/mas-jugados'
~~~

En el primer inicio, esperar la carga del esquema, los seis millones de reseñas y la creación de índices. Revisar el estado de `postgres`, `backend` y `frontend` y los logs si vence el plazo. En pgAdmin seleccionar la conexión preconfigurada a `postgres:5432` dentro de Docker y usar las credenciales de la base. Desde el navegador probar catálogo, filtros, detalles, reseñas, inicio de sesión y dashboard con permisos apropiados. Comprobar que la consulta al catálogo devuelve datos y que el clúster tiene un líder y dos secundarios operativos. GLPI y Nextcloud requieren preparar o importar su contenido según el capítulo 12. n8n requiere importar y activar los JSON según el capítulo 13.

| Servicio | Acceso local predeterminado | Publicación declarada |
|---|---|---|
| Angular/Nginx | `http://localhost:4200/` | Puerto 4200 del host a 80, más la entrada HTTPS de Funnel si está activa. |
| Express y Swagger | `http://localhost:3000/api-docs/` | Puerto 3000 del host. Swagger también se reenvía desde Nginx. |
| SQL por HAProxy | `127.0.0.1:5433` | Loopback. Dentro de Docker se usa `postgres:5432`. |
| pgAdmin | `http://127.0.0.1:5050/` | Loopback. |
| GLPI | `http://localhost:8080/` | Puerto del host sin IP de enlace explícita. |
| Nextcloud | `http://localhost:8085/` | Puerto del host sin IP de enlace explícita. |
| Grafana | `http://localhost:3001/` | Puerto del host sin IP de enlace explícita. |
| Prometheus, Alertmanager, n8n | `127.0.0.1:9090`, `127.0.0.1:9093` y `127.0.0.1:5678` | Loopback. |
| etcd, REST de Patroni, exportadores y bases auxiliares | DNS y puertos internos de Compose | Tránsito dentro de Docker. |

Las URLs corresponden a los valores predeterminados y se ajustan si cambian los puertos en `.env`. Desde otra máquina, el alcance de los puertos del host depende del firewall y del enlace del puerto. Para detener la operación conservando los datos, usar `docker compose stop`. Para retirar los contenedores conservando los volúmenes, usar `docker compose down` sin la opción de borrado de volúmenes.

[Variables de referencia](.env.example) · [Compose](docker-compose.yml) · [Flujo y pruebas de catálogo](docs/historias_usuario/HU21-integracion-full-stack.md)

## 5. Docker Compose, redes y persistencia

El [Dockerfile de frontend](frontend/Dockerfile) compila Angular con Node.js 22 en una primera etapa y copia solo los estáticos a Nginx Alpine. El [Dockerfile de backend](backend/Dockerfile) instala dependencias de producción con `npm ci --omit=dev`, asigna la propiedad de archivos a `node` y ejecuta Express con ese usuario. Las pruebas y el desarrollo se ejecutan con Node fuera de las imágenes de producción. Compose construye imágenes locales del frontend y el backend e inyecta la configuración del entorno. Actions construye imágenes etiquetadas para GHCR a partir de los mismos Dockerfiles.

| Red lógica | Función |
|---|---|
| `app-network` (`gamer_app_network`) | Conexión de frontend, API, Tailscale y Prometheus según Compose. |
| `db-network` (`gamer_db_network`) | SQL de aplicación, proxy, nodos, backup, pgAdmin y servicios que consumen datos o métricas. |
| `cluster-control` | Red interna de Patroni y etcd para el liderazgo y el estado distribuido. |
| `monitoring-network` (`gamer_monitoring_network`) | Prometheus, Grafana, Alertmanager, exportadores y n8n. |
| `glpi-network` | GLPI, su MariaDB y n8n. |
| `nextcloud-network` (`gamer_nextcloud_network`) | Nextcloud, su PostgreSQL y n8n. |

Compose declara **24 servicios**, incluido `backup-permissions`, que prepara el volumen de copias y debe terminar con código cero. Cada nodo de PostgreSQL y cada miembro de etcd tienen su propio volumen. Los volúmenes de backup, pgAdmin, GLPI/MariaDB, Nextcloud y su BD, Tailscale, Prometheus, Grafana, Alertmanager y n8n conservan información específica de cada servicio. Conservarlos permite reemplazar contenedores sin borrar sus datos.

La salud del endpoint SQL depende de que HAProxy encuentre un primario válido. Express espera ese estado, verifica su conexión mediante Sequelize y recién entonces escucha. El frontend espera al backend y Tailscale espera al frontend. Las bases auxiliares también tienen comprobaciones de salud. El healthcheck de Express consulta Swagger. Para probar el recorrido funcional se añade una consulta al catálogo desde Nginx, conforme al capítulo 4.

La revisión local de Docker del 19/11 registró backend y proxy saludables. En esa consulta, los contenedores de frontend, Tailscale, Prometheus, Grafana, Nextcloud y n8n se habían creado y todavía esperaban arrancar. La HU-21 documenta capturas de filtro en el frontend y respuesta de API, y la HU-09 registra frontend y API HTTP 200 en su ensayo del 15/11. La prueba funcional y la persistencia tras recrear servicios se deben volver a registrar sobre el entorno completo de entrega.

[Configuración de servicios y volúmenes](docker-compose.yml) · [HU-11](docs/historias_usuario/HU-11-DOCKER-APP.md) · [Captura de búsqueda en el frontend](docs/images/hu21/frontend-busqueda-por-filtros.png) · [Captura de la respuesta de API](docs/images/hu21/backend-endpoint-por-filtros.png)

## 6. Migración, esquema y carga de datos

El DDL adapta el esquema a los modelos Sequelize. `logins` y `juegos` son entidades referenciadas. `"Usuarios"` relaciona un perfil único con su login y `resenas` relaciona cada texto con un login y un juego. Esas claves foráneas aplican borrado en cascada. `accesos` y `audit_logs` conservan eventos y sus campos de contexto. El DDL incluye claves primarias, unicidad de `googleId` y `loginId` de perfil y nulabilidad según el dato.

~~~mermaid
flowchart LR
    L[("logins")] -->|1 a 0..1| U[("Usuarios")]
    L -->|1 a N| R[("resenas")]
    J[("juegos")] -->|1 a N| R
    A[("accesos · registro de eventos")]
    AU[("audit_logs · registro de auditoría")]
~~~

En un clúster vacío, `post_bootstrap` crea la base objetivo y ejecuta DDL → seed → índices → `CHECKPOINT`. El script de carga usa operaciones por conjuntos con `generate_series`, genera datos sintéticos y asigna los identificadores a juegos y logins existentes. El bootstrap usa `synchronous_commit=off` solo en su sesión para inicializar antes de que exista una réplica síncrona. En operación normal rige el modo síncrono estricto. La carga se diseñó para inicialización. Antes de migrar datos históricos del volumen anterior `gamer_pgdata`, exportar el origen, restaurar en una base aislada, comprobar compatibilidad, conteos e integridad, y planificar la incorporación al primario. La réplica recibe WAL. La planificación de una migración histórica conserva el volumen anterior y evita ejecutar el seed sobre datos que deban mantenerse.

| Tabla | Filas del seed HU-06 | Observación HU-08 |
|---|---:|---|
| `juegos` | 5.000 | 5.000 filas, 5.336 kB. |
| `logins` | 10.000 | 10.000 filas, 3.544 kB. |
| `"Usuarios"` | 10.000 | 10.000 filas, 1.024 kB. |
| `resenas` | 6.000.000 | 6.000.000 filas, 1.595 MB con índices. |
| `accesos` | 10.000 | 10.000 filas, 1.816 kB. |
| `audit_logs` | 10.000 | 10.003 filas, 2.456 kB. |
| **Total** | **6.045.000** | **6.045.003** en la medición HU-08. |

La HU-06 registró **601 s** para la carga aleatoria. La HU-22 registró **622,9 s** en una inicialización de referencia y un rango aproximado de 600 a 800 s en sus ensayos. Los tiempos dependen del hardware. El **19/11/2026** se consultó el primario local por HAProxy desde el cliente PostgreSQL del contenedor de backups. PostgreSQL 16.15 devolvió **1.694.440.471 bytes** para la base completa (**1.616 MB** según `pg_size_pretty`) y **6.045.000 filas** repartidas exactamente como en la columna del seed. Las 6.045.003 filas y los 1.595 MB de `resenas` con índices proceden de la medición HU-08 del 15/11 sobre otra instancia. La consulta de tamaño y conteos se puede repetir en pgAdmin conectado al primario por HAProxy.

~~~sql
SELECT current_database(), pg_database_size(current_database()) AS bytes,
       pg_size_pretty(pg_database_size(current_database())) AS tamano;

SELECT 'juegos' AS tabla, count(*) AS filas FROM juegos
UNION ALL SELECT 'logins', count(*) FROM logins
UNION ALL SELECT 'Usuarios', count(*) FROM "Usuarios"
UNION ALL SELECT 'resenas', count(*) FROM resenas
UNION ALL SELECT 'accesos', count(*) FROM accesos
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;
~~~

El punto 4 de la cátedra fija seis millones **por cada tabla del conjunto de prueba**. El umbral se acredita para `resenas`. Las demás tablas forman parte del seed y se usan en varias mediciones HU-08. Para acreditar el punto completo se necesita acordar con la cátedra el alcance de las tablas de carga o ampliar el dataset y repetir las mediciones relevantes. El capítulo 15 registra los tiempos y resultados históricos de backup y restauración.

[DDL](db-scripts/init/01_schema_init.sql) · [Seed](db-scripts/seeders/02_massive_seed_6M.sql) · [Bootstrap](db-scripts/cluster/bootstrap.sh) · [Evidencia de carga](docs/images/hu06/hu06_captura_ejecucion_6M.png) · [HU-06](docs/historias_usuario/hu06.md) · [HU-22](docs/historias_usuario/HU22-inicializacion-nativa-postgresql.md)

## 7. Optimización SQL

La HU-08 midió nueve consultas del backend el 15/11/2026 en PostgreSQL 16.15 con `EXPLAIN (ANALYZE, BUFFERS)`. En el entorno de medición se retiraron temporalmente ocho índices dentro de una transacción para ejecutar la línea base. `ROLLBACK` revirtió ese cambio y se midió la versión con índices sobre el mismo dataset. Los resultados incluyen efectos del estado de caché y del planificador. El procedimiento que retira índices toma bloqueos y corresponde a un entorno aislado.

| ID | Operación | Antes (ms) | Después (ms) | Buffers compartidos antes → después | Cambio de plan observado |
|---|---|---:|---:|---:|---|
| Q1 | Reseñas del juego por likes y fecha | 379,526 | 0,312 | 149.294 → 43 | Escaneo paralelo, join y sort → índice y nested loop. |
| Q2 | Conteo de reseñas del juego | 304,085 | 0,474 | 148.248 → 963 | Escaneo paralelo → index-only scan. |
| Q3 | Buscar reseña por login y juego | 395,334 | 0,057 | 148.248 → 3 | Escaneo paralelo → index scan compuesto. |
| Q4 | Diez juegos por calificación | 2,541 | 0,097 | 500 → 11 | Escaneo y top-N sort → índice ordenado. |
| Q5 | Sugerencias por texto y calificación | 2,451 | 0,590 | 500 → 209 | Escaneo y top-N sort → índice ordenado con filtro. |
| Q6 | Juego con mayor cantidad de reseñas | 747,094 | 1.274,219 | 148.265 → 4.765.701 | Escaneo secuencial paralelo → index-only scan paralelo, con regresión. |
| Q7 | Buscar login por username exacto | 1,110 | 0,098 | 300 → 3 | Escaneo secuencial → B-tree de igualdad. |
| Q8 | Conteo de acciones `BUSQUEDA_JUEGO` | 1,260 | 0,081 | 216 → 2 | Escaneo secuencial → index-only scan. La muestra tenía cero filas coincidentes. |
| Q9 | Conteos de login por día y éxito | 3,173 | 1,013 | 256 → 154 | Escaneo secuencial y agregación → index-only scan, sort y agregación. |

En Q1 y Q2 se aprovecha `(juegoId, likes DESC, createdAt DESC)`. En Q3, `(loginId, juegoId)` acota la búsqueda por un par. El índice de calificación de juegos ordena por calificación e ID y añade columnas mediante `INCLUDE`. Para Q5 se evaluó GIN trigram, pero el plan medido prefirió el B-tree ordenado y aplicó el filtro textual. Para Q7 se distingue la igualdad de username de la comparación normalizada. En Q8 se usa el prefijo de `(accion, fecha DESC)`. En Q9 el filtro conserva un rango sobre `fecha` y la conversión a fecha de calendario se usa para agrupar.

Los dos índices compuestos de reseñas ocupaban alrededor de 180 MB y 127 MB. Cada índice añade almacenamiento y trabajo de mantenimiento en escrituras. Se reutilizan prefijos donde se pueden servir varias consultas. Q6 recorre el conjunto completo para agregarlo. La regresión se conserva como resultado y justifica evaluar una agregación previamente calculada o un rediseño de la consulta. Se registraron `shared_buffers=128MB`, `effective_cache_size=4GB`, `maintenance_work_mem=64MB`, `work_mem=4MB`, `random_page_cost=4` y `default_statistics_target=100`, sin cambios de tuning en esa prueba.

[Consultas y planes antes](db-scripts/optimizations/explain_queries_before.sql) · [Consultas y planes después](db-scripts/optimizations/explain_queries_after.sql) · [Medición de línea base](db-scripts/optimizations/measure_baseline_transaction.sql) · [DDL y justificación de índices](db-scripts/optimizations/create_indexes.sql) · [Informe HU-08](docs/historias_usuario/HU08-optimizacion-consultas-sql.md) · [Comparación gráfica](docs/images/hu08/comparacion-real.svg)

## 8. Replicación y prueba de failover

~~~mermaid
flowchart LR
    API["Express, pgAdmin y backups"] --> H["HAProxy · postgres:5432"]
    H -->|"SQL al líder comprobado por /primary"| P1[("pg-node-1 · líder inicial")]
    H -.->|"Comprueba candidaturas"| P2[("pg-node-2 · réplica síncrona inicial")]
    H -.->|"Comprueba candidaturas"| P3[("pg-node-3 · réplica asíncrona inicial")]
    P1 -->|WAL síncrono| P2
    P1 -->|WAL asíncrono| P3
    P1 <--> C["etcd · 3 miembros · mayoría 2"]
    P2 <--> C
    P3 <--> C
~~~

Patroni coordina el liderazgo en etcd y comprueba la línea temporal. PostgreSQL usa streaming replication, slots, WAL en modo `replica`, autenticación SCRAM y checksums. La réplica síncrona protege la escritura confirmada en funcionamiento normal. El modo estricto espera confirmación de una réplica y puede bloquear escrituras si ambas desaparecen. El otro secundario puede presentar retraso. HAProxy dirige nuevas conexiones al único nodo que responde como primario en `/primary` y cierra sesiones del destino que deja de estar disponible. La aplicación mantiene estable el nombre SQL `postgres`.

### Verificación y resultados

En un entorno de prueba con la aplicación activa, identificar líder y réplicas y verificar etcd. La prueba integral crea una tabla temporal de verificación en la base de trabajo, detiene el primario, comprueba la recuperación por SQL y HTTP e intenta reincorporar el nodo. Ejecutarla solo sobre el stack de demostración preparado para la interrupción. Los dos primeros comandos son comprobaciones de estado.

~~~powershell
docker compose exec -T pg-node-1 patronictl -c /etc/patroni.yml list
docker compose exec -T etcd-1 etcdctl endpoint health --cluster
pwsh -File db-scripts/cluster/verify-failover.ps1
~~~

| Comprobación del 15/11/2026 | Resultado documentado |
|---|---|
| Replicación inicial | `pg-node-1` como líder. Ambas réplicas en streaming leyeron el registro previo con la transacción en modo lectura. Retraso observado de 0 bytes en la síncrona y 259.584 bytes en la asíncrona. Los tres miembros etcd respondieron. |
| Caída del primario | Primera petición al catálogo HTTP 500. Patroni promovió `pg-node-2` y la línea temporal cambió de 1 a 2. La API volvió a HTTP 200 en **26,9 s** desde la orden de parada, con el mismo contenedor de Express. |
| Verificación de datos | A través del proxy se leyó la escritura previa y se confirmó una escritura posterior con el nodo original detenido. |
| Reincorporación | Al arrancar `pg-node-1`, `pg_rewind` finalizó con código cero. El nodo regresó como secundario, pudo leer ambos registros y quedó un solo líder. |
| Backup durante la operación normal del clúster | Se documentó un `pg_dump` de 127.396.993 bytes a través del proxy. |

El ensayo demuestra la pérdida de un nodo en el host de prueba y una interrupción transitoria de la API. La recuperación de un host completo, la caída del único proxy y la pérdida de mayoría de etcd requieren otros escenarios operativos. La configuración actual tiene `archive_mode=off` y el capítulo 15 documenta la recuperación lógica. Para un incidente, revisar primero quórum y roles, restablecer conectividad, verificar el nodo que conserva el liderazgo y comprobar las escrituras antes de reincorporar una réplica divergente.

[Configuración Patroni](db-scripts/cluster/patroni.yml) · [Configuración HAProxy](db-scripts/cluster/haproxy.cfg) · [Script de prueba](db-scripts/cluster/verify-failover.ps1) · [Evidencia de replicación](docs/images/hu09/replicacion-compose-oficial.png) · [Evidencia de failover](docs/images/hu10/failover-compose-oficial.png) · [Informe de replicación](docs/historias_usuario/HU-09-CLUSTER-POSTGRESQL.md) · [Informe de failover](docs/historias_usuario/HU-10-FAILOVER-POSTGRESQL.md)

## 9. Integración y despliegue continuos

~~~mermaid
flowchart LR
    C["Push o PR según rama"] --> LB["Sintaxis JS"]
    C --> LF["Tipos TypeScript"]
    LB --> TB["Suite backend"]
    LF --> TF["Script test:ci frontend"]
    TB --> I["Buildx y GHCR en push a main/develop"]
    TF --> I
    I --> V["Validación de Compose con entorno de CI"]
~~~

Actions ejecuta Node.js 22. Los pushes a `main`, `develop`, `feature/**` y `fix/**`, y los PRs hacia `main` o `develop`, disparan el workflow. Los jobs de build y publicación requieren éxito de ambos caminos y solo se ejecutan en push a `main` o `develop`. GHCR recibe etiquetas de rama y de SHA. El token nativo de GitHub autentica el registro. Las credenciales reales permanecen en el entorno de ejecución y el job de verificación utiliza valores de prueba.

| Comprobación | Evidencia y alcance |
|---|---|
| Pipeline verde | La ejecución 44443696317 para `173477b` registró verificaciones, pruebas configuradas y build/publicación de ambas imágenes con resultado exitoso. |
| Prueba negativa | Las capturas de HU-12 muestran casos de sanitización aprobados y fallidos. El vínculo inequívoco entre un commit negativo, su ejecución en Actions y el bloqueo de publicación queda por incorporar. La dependencia `needs` de los jobs describe el bloqueo que aplica si falla una prueba real. |
| Frontend | `npm run lint` pasó. `test:ci` imprime un mensaje y no invoca Vitest. La ejecución directa de `npm test -- --watch=false` del 19/11 encontró tres imports obsoletos en las pruebas de resultados, pago exitoso y servicio de pagos. |
| Backend | Se ejecutaron diez pruebas unitarias de sanitización con resultado satisfactorio. La comprobación estática del job corresponde a `node --check index.js`. |
| Staging | `deploy-staging` valida la configuración con `docker compose --env-file .env config --quiet`. El workflow carece de una entrega a un host de destino y de una comprobación de que el SHA haya llegado a la URL publicada. |

### Recuperación de una versión

1. Identificar un SHA previamente validado en GHCR y registrar las versiones del frontend y backend actualmente en servicio. Comprobar la compatibilidad con la base y respaldarla si hay cambios de esquema.
2. En el entorno destino, definir un override de Compose que reemplace `image` en `frontend` y `backend` por las dos imágenes etiquetadas con ese SHA. El Compose base referencia imágenes locales. El procedimiento de rollback necesita ese override para seleccionar las imágenes del registro.
3. Con los dos archivos de Compose activos, descargar las dos imágenes y recrear únicamente `frontend` y `backend` con `--no-build`, conservando redes y volúmenes. Volver a validar catálogo, sesión y URL publicada. La reversión de datos o esquema se evalúa con el procedimiento de restauración del capítulo 15.
4. Guardar el SHA que quedó activo y la evidencia del recorrido. La HU-12 documenta el plan. Su ejecución en el destino publicado queda por acreditar.

[Workflow real](.github/workflows/ci-cd-pipeline.yml) · [Definición de scripts frontend](frontend/package.json) · [Ejecución de Actions](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08/actions/runs/44443696317) · [Commit de integración](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08/commit/173477b50be616e38919271d50e0ae8d28ad5159) · [Evidencia de sanitización correcta](docs/images/hu12/HU-12_%20testeo_de_sanitizado_correcto.png) · [Evidencia del caso fallido](docs/images/hu12/HU-12_%20testeo_de_fallo_de_sanitizado.png) · [HU-12](docs/historias_usuario/HU-12-CI-CD.md)

## 10. Publicación en Internet y perímetro

Tailscale Funnel termina HTTPS y reenvía el tráfico a Nginx, que sirve Angular y las rutas de API del capítulo 2. El servicio conserva la identidad en `gamer_tailscale_state` y obtiene el dominio del tailnet a partir de la configuración de Serve. La URL de Funnel es pública. Express aplica autenticación y rol a operaciones protegidas. El administrador del tailnet habilita MagicDNS, certificados HTTPS y la capacidad Funnel para el nodo anfitrión. Registrar el equipo con la configuración indicada en el capítulo 4.

~~~powershell
docker compose ps frontend tailscale
docker compose exec tailscale tailscale funnel status
~~~

La salida de `funnel status` entrega la URL efectiva del nodo. Desde una conexión externa al host, como datos móviles, abrir la URL HTTPS y comprobar certificado, portada, búsqueda, detalle directo y sesión. Registrar URL, fecha, red usada, resultado HTTP y disponibilidad al inicio de la defensa. Capturar la salida del túnel y el navegador sin mostrar credenciales. La HU-13 declara pendiente la verificación externa y este informe carece de una URL operativa acreditada.

### Enlace del host y firewall

- SQL, pgAdmin, Prometheus, Alertmanager y n8n están ligados a loopback. Funnel apunta solo al frontend. etcd, PostgreSQL de los nodos y las bases auxiliares operan en sus redes Docker.
- Backend, frontend HTTP, GLPI, Nextcloud y Grafana publican puertos del host sin dirección de enlace explícita. Los destina a acceso local o autorizado la política efectiva del equipo. Falta acreditar esa política mediante revisión del firewall, restricciones de acceso y una comprobación externa autorizada.
- Para la demostración, registrar qué servicios se ofrecen al público, probar únicamente la URL prevista y comprobar desde una red autorizada que los puertos administrativos quedan fuera del acceso público. La exposición de Swagger mediante Nginx, la dependencia de un solo host y la posibilidad de abuso de consultas públicas se registran como riesgos. El túnel deja de servir cuando se apaga el host o falla su conectividad.

[Configuración Serve/Funnel](tailscale/serve.json) · [Puertos en Compose](docker-compose.yml) · [Procedimiento y evidencias pendientes HU-13](docs/historias_usuario/HU-13-TAILSCALE-FUNNEL.md)

## 11. Monitoreo y observabilidad

Prometheus recolecta y evalúa reglas cada 10 segundos. Supervisa node_exporter en `:9100`, cAdvisor en `:8080`, postgres_exporter en `:9187`, las métricas de Patroni en `:8008` para los tres nodos y las de HAProxy en `:8404`. Alertmanager agrupa eventos y los dirige al webhook de n8n. Grafana provisiona la fuente Prometheus y el tablero con UID `gaming-observability-overview`.

| Área del tablero | Señales disponibles |
|---|---|
| Host | CPU y memoria, espacio e I/O de disco y tráfico de red. La regla de espacio usa un dispositivo y punto de montaje del entorno Docker Desktop. |
| Contenedores | CPU y memoria mediante cAdvisor. Existe una alerta por pérdida de señal de contenedores críticos. El tablero actual requiere completar la visualización de estado y reinicios por contenedor. |
| Aplicación | Docker comprueba Nginx y Express mediante healthchecks. La disponibilidad HTTP desde Internet y sus latencias requieren una sonda y un panel propios. |
| PostgreSQL | Conexiones activas, cache hit ratio, transacciones, deadlocks y señales del exportador. El análisis individual de SQL corresponde a la HU-08. El tablero todavía carece de métricas de consultas lentas. |
| Replicación | Líder activo, nodos en servicio y lag de replicación. El panel de liderazgo se ajustó en el PR #24. |

Las nueve reglas cubren CPU general (>85 % durante 1 min), CPU de estrés (>60 % durante 5 s, evaluada cada 10 s), disco libre (<15 % durante 2 min), falta de señal de contenedores, memoria de contenedores, ausencia de líder, lag superior a 50 MiB, conexiones superiores al 80 % del límite y deadlocks. La HU-14 registra el paso de `pending` a `firing` durante la prueba de estrés y el retorno a inactiva al retirar la carga. La evaluación del ensayo corresponde a la anomalía de CPU y las demás reglas se pueden validar por escenarios específicos.

Abrir Prometheus en `http://127.0.0.1:9090/targets`, verificar que estén disponibles los targets del host y del clúster y abrir Grafana en `http://localhost:3001/`. Revisar el tablero, las etiquetas y el disco del host. El primer script consulta el estado y usa la configuración local para Grafana. El segundo modifica la carga del entorno temporalmente y se reserva para una demostración controlada. Ambos scripts usan los puertos locales predeterminados.

~~~powershell
pwsh -File monitoring/verify-monitoring.ps1
pwsh -File monitoring/test-alert-trigger.ps1
~~~

Para acreditar la prueba del entorno final, guardar las métricas con fecha y SHA, el estado de las reglas y la cronología de la alerta. El comportamiento documentado en HU-14 y la configuración se conservan en el repositorio. Las capturas de la última corrida integral quedan por centralizar.

[Configuración de Prometheus](monitoring/prometheus/prometheus.yml) · [Reglas](monitoring/prometheus/alert_rules.yml) · [Dashboard](monitoring/grafana/dashboards/gaming-observability-overview.json) · [Script de estrés](monitoring/test-alert-trigger.ps1) · [Resultados HU-14](docs/historias_usuario/HU-14-MONITOREO-PROMETHEUS-GRAFANA.md)

## 12. Gestión de incidencias y documentación colaborativa

### Mesa de ayuda GLPI

GLPI utiliza una MariaDB 10.11 persistente y una red dedicada. La configuración de HU-15 define una entidad de soporte, categorías ITIL y un formulario Self-Service que exige tipo, categoría y urgencia. El solicitante describe el problema y el técnico clasifica, asigna, registra diagnóstico y resolución y valida el cierre. El dump final permite recuperar la mesa de ayuda de prueba, con el formulario y el historial. Para reproducirla, preparar la instancia y restaurar el dump de HU-16 en una base dedicada de laboratorio con las credenciales del entorno. La importación es una operación sobre la instancia destino. Conservar previamente su estado si tiene datos propios y comprobar compatibilidad con la versión de GLPI antes de importar.

| Ticket | Tipo y urgencia | Caso registrado | Responsable técnico de GLPI | Cierre documentado |
|---|---|---|---|---|
| #2 | Incidencia · Alta | Bloqueo CORS entre Angular y Express. | Full-stack | Se documentó el ajuste de conectividad y se verificó la respuesta. El acceso integrado usa el mismo origen de Nginx. |
| #3 | Incidencia · Alta | Degradación de rendimiento con el dataset masivo. | DBA | Se documentaron diagnóstico e índices. Las mediciones del backend se conservan en HU-08. |
| #4 | Incidencia · Media | Expiración de JWT y pérdida de sesión. | Full-stack | Se documentó el tratamiento de expiración en el cliente. La revocación selectiva sigue en el análisis de seguridad. |
| #5 | Incidencia · Media | HTTP 429 en la integración IGDB. | Full-stack | Se documentó el tratamiento del límite y la reutilización del catálogo persistido. |
| #6 | Incidencia · Muy alta | Timeout de socket y agotamiento del pool PostgreSQL. | DBA | Se registró el diagnóstico del pool y su validación en el laboratorio del ticket. |
| #7 | Incidencia · Alta | Saturación de CPU y memoria detectada por monitoreo. | Infraestructura | Se documentaron mitigación y seguimiento de métricas. |
| #8 | Incidencia · Muy alta | Riesgo de inyección SQL en filtros de la API. | Full-stack | Se registraron tratamiento y cierre del caso. El capítulo 14 describe la revisión vigente de los controles y del riesgo residual. |
| #9 | Incidencia · Alta | Permisos insuficientes para escribir el respaldo. | Infraestructura | Se documentó el ajuste de permisos. Compose incorpora `backup-permissions` y la HU-07 documenta la restauración. |
| #10 | Solicitud · Media | Cuenta de lectura para auditoría y réplica. | DBA | Aprovisionamiento y verificación de privilegios documentados. |
| #11 | Solicitud · Baja | Calibración del umbral de alertas. | Infraestructura | Ajuste de monitoreo y comprobación documentados. |

La HU-16 registra los diez tickets como cerrados y muestra evidencias de asignación y seguimiento. El enunciado pide al menos diez **incidencias** reales o reproducibles. La clasificación registrada muestra **ocho incidencias y dos solicitudes**, con al menos una de rendimiento y una de seguridad. Faltan dos incidencias trazables para acreditar literalmente el mínimo. Cada una requiere una reproducción o prueba defensiva controlada, asignación, vínculo con tarea o cambio, validación y cierre con evidencia. En los tickets históricos, distinguir la resolución consignada en GLPI de lo que se puede comprobar en el código vigente.

[Formulario y evidencias HU-15](docs/historias_usuario/HU-15-GLPI.md) · [Historial y evidencias HU-16](docs/historias_usuario/HU-16-GLPI-TICKETS.md) · [Dump final de GLPI](glpi/backup/glpi_hu16_final.sql) · [Captura de tickets](docs/images/hu16/01_lista_tickets_glpi.png)

### Nextcloud

Nextcloud centraliza informes y evidencias mediante una base PostgreSQL dedicada y volúmenes persistentes. La documentación registra cinco perfiles técnicos y una cuenta de administración. Los permisos mostrados son los de escritura por rol. El administrador conserva control de plataforma. Las lecturas y los accesos denegados se comprueban con las cuentas de cada rol.

| Carpeta | Contenido | Roles con escritura según HU-17 |
|---|---|---|
| `/01-Arquitectura` | Diagramas y decisiones de diseño. | Infraestructura y Desarrollo Full-Stack. |
| `/02-BaseDeDatos` | Esquema, mediciones y documentación de recuperación. | DBA. |
| `/03-CicloDevOps` | Compose, pipeline y evidencias operativas. | Infraestructura y Desarrollo Full-Stack. |
| `/04-Seguridad` | Matriz y evidencias redactadas de seguridad. | Seguridad. |
| `/05-EntregablesFinales` | Informes de cierre, evidencias y versiones de entrega. | QA/Scrum. |

Para reproducir la documentación, inicializar Nextcloud y su base, consultar los respaldos y reconciliar la configuración, los archivos y los permisos de la instancia destino. La HU-17 aporta capturas de carpetas, usuarios, permisos y archivos cargados. Para cerrar la HU-20, vincular la versión entregada con su SHA, verificar la lectura con una cuenta autorizada y registrar la publicación del PDF en la carpeta final según el criterio interno del equipo. Esa publicación queda pendiente de evidencia.

[Despliegue y matriz RBAC](docs/historias_usuario/HU-17-NEXTCLOUD.md) · [Captura de permisos](docs/images/hu17/05_nextcloud_folder_permissions_rbac.png) · [Captura de archivos cargados](docs/images/hu17/06_nextcloud_files_uploaded.png) · [Respaldos de Nextcloud](nextcloud/backup/)

## 13. Automatización con n8n

n8n corre con almacenamiento persistente en `n8n_data`, publica su interfaz en loopback y se conecta a monitoreo, GLPI, Nextcloud y datos. Recibe `backup-data` en modo de lectura. Para reproducir el stack, importar los tres JSON desde la interfaz local, completar y reasignar las credenciales en el gestor de n8n, probar con datos de laboratorio y activar los flujos que correspondan. Registrar su estado después de la importación. Los tres archivos versionados se exportaron con `active=false`.

~~~mermaid
flowchart TD
    A["Prometheus detecta anomalía"] --> AM["Alertmanager agrupa y envía webhook"]
    AM --> N1["Flujo 1 · normaliza el primer evento"]
    N1 --> G["GLPI · abre sesión, crea ticket, cierra sesión"]
    S2["Flujo 2 · disparador diario 02:00"] --> V["Verifica último dump, tamaño y SHA-256"]
    V -->|Válido| L["Registra éxito en la ejecución"]
    V -->|Falla| G
    S3["Flujo 3 · lunes 08:00"] --> P["Consulta métricas de Prometheus"]
    P --> AI["Gemini genera el análisis"]
    AI --> NC["Escribe Markdown por WebDAV en Nextcloud"]
~~~

Las horas son las de los disparadores en los JSON y se interpretan en la zona configurada del orquestador. El entorno propone la zona de Buenos Aires.

| Flujo | Comportamiento versionado | Prueba de integración y evidencia necesaria |
|---|---|---|
| 1. Alertas a GLPI | Recibe el webhook en `/webhook/alerta-infraestructura`, toma el primer evento, transforma severidad y crea un ticket mediante la API de GLPI. `critical` se mapea a urgencia 5 y `warning` a 4. Alertmanager también envía resoluciones. | La HU-18 describe el ensayo de estrés y la apertura de un ticket. Para acreditar el recorrido, registrar el estado `firing`, la ejecución de n8n, el ID y urgencia del ticket y el tratamiento de repetición y resolución. |
| 2. Integridad de backups | Examina el último `.dump`, comprueba que tenga contenido y compara su SHA-256 con el manifiesto. La rama válida registra éxito y la de fallo intenta abrir un ticket urgente. El flujo comprueba integridad de archivo. La restauración se comprueba por separado en el capítulo 15. | Probar en una instancia de laboratorio con un dump válido y un caso de manifiesto ausente o inválido. Conservar hora, ejecución, nombre y tamaño del respaldo, resultado de la comparación y ticket de la prueba negativa. |
| 3. Informe de rendimiento | Consulta la API instantánea de Prometheus para CPU, memoria, conexiones PostgreSQL y contenedores. Solicita un análisis al modelo configurado `gemini-3.6-flash` y publica Markdown con marca temporal en Nextcloud mediante WebDAV. La compatibilidad del modelo depende de la cuenta y del servicio usado en el entorno. | Verificar el archivo en Nextcloud y registrar la ejecución y la ventana de métricas consultada. Probar error de proveedor o de escritura y registrar la respuesta. Quedan pendientes la consulta del histórico completo de 24 h y un paso explícito de notificación al equipo. |

Para cada prueba, conservar el identificador de ejecución, la fecha, el commit, el escenario de entrada, el resultado y el identificador del artefacto o ticket. Si falla un nodo, guardar su nombre y el mensaje con los datos sensibles ocultos. La HU-18 describe pruebas de los tres flujos. Los archivos JSON permiten reproducir su configuración. Quedan por incorporar las capturas citadas en la HU-18, el registro de errores de las integraciones y la verificación en el entorno publicado.

El webhook del Flujo 1 carece de autenticación en su exportación. Antes de usarlo como canal de incidentes, autenticar al emisor, validar esquema y tamaño, procesar las alertas con una política de deduplicación y tratar `resolved` de forma explícita. Usar identidades con permisos limitados para GLPI y WebDAV. El nodo de Gemini configura la clave como parámetro de URL y carece de referencia a una credencial de n8n. Gestionar la clave en el almacén de credenciales, verificar su ausencia de URLs y registros, y configurar cuotas y manejo de fallos. Los tres flujos documentados crean registros, verifican archivos o publican reportes. Una automatización futura que interrumpa servicios requiere aprobación humana previa.

[Configuración de Alertmanager](monitoring/alertmanager/alertmanager.yml) · [Exportaciones JSON](n8n/workflows/) · [Integraciones y pruebas HU-18](docs/historias_usuario/HU-18-N8N-AUTOMATIZACION.md)

## 14. Ciberseguridad y respuesta a incidentes

### Matriz de amenazas

La HU-19 usa probabilidad e impacto de 1 a 3 y obtiene el riesgo multiplicando ambas dimensiones. En esta matriz, M corresponde a media y A a alta o alto según la columna. Se distinguen los controles implementados de las correcciones propuestas.

| ID | Amenaza | Prob. | Impacto | Riesgo | Control o señal vigente | Tratamiento pendiente |
|---|---|---:|---:|---:|---|---|
| R01 | Ransomware o destrucción de datos | M | A | 6 | Volúmenes separados, respaldo lógico local, alertas de disco y registros de backup. | Copia cifrada y protegida fuera del host. |
| R02 | Inyección SQL en filtros y consultas dinámicas | M | A | 6 | Operadores de Sequelize en filtros del catálogo. | Parametrizar expresiones revisadas, validar tipos y reducir permisos de la cuenta de API. |
| R03 | XSS y exposición de sesión | M | A | 6 | Sanitización Express, renderizado de texto Angular y suite de sanitización. | Revisar URLs de recursos y una política CSP compatible. |
| R04 | CSRF en flujos con sesión | M | M | 4 | JWT de API en encabezado Bearer. | Verificar estado OAuth, origen y atributos de cookies donde corresponda. |
| R05 | Fallas de autorización de reseñas | A | A | 9 | JWT y RBAC en el área administrativa. | Exigir identidad autenticada y autorización en todas las escrituras y comprobar el usuario efectivo. |
| R06 | Vulnerabilidades de dependencias y cadena de suministro | A | A | 9 | Lockfiles, `npm ci`, barreras de CI y auditoría manual. | Remediar por impacto, fijar acciones e imágenes y automatizar escaneo. |
| R07 | Abuso del webhook o de credenciales de automatización | A | A | 9 | Puerto de n8n ligado a loopback e historial de flujos y tickets. | Autenticar y validar Alertmanager, limitar volumen, deduplicar y restringir permisos en GLPI. |
| R08 | Robo de credenciales o filtración en Git, dumps y logs | M | A | 6 | Exclusión de `.env` y TLS en Funnel. | Eliminar valores de respaldo inseguros, revisar y rotar credenciales históricas, verificar protección de secretos en GitHub. |
| R09 | Abuso de API de IA, uso indebido de claves o de datos | M | A | 6 | Gemini desde configuración de entorno en el backend y revisión de peticiones mediante logs. | Claves por entorno, cuotas, alertas de consumo y reducción de datos enviados al proveedor. |
| R10 | Escalamiento de privilegios en Docker | M | A | 6 | Express se ejecuta como usuario `node`. | Reducir capacidades y accesos de cAdvisor, que corre privilegiado y monta sockets del host. |
| R11 | DoS/DDoS contra el acceso público y consultas costosas | M | A | 6 | TLS, PostgreSQL separado y métricas de recursos. | Añadir límites de tasa y tamaños, medir disponibilidad HTTP y verificar reglas de firewall. |

### Auditoría de dependencias y controles

Los registros de `npm audit` de HU-19 corresponden al **19/11/2026**. Un resultado de auditoría identifica dependencias y avisos aplicables al árbol examinado. La exposición efectiva se evalúa contra el uso real y la configuración.

| Ámbito | Críticas | Altas | Moderadas | Bajas | Total |
|---|---:|---:|---:|---:|---:|
| Backend, árbol completo | 1 | 4 | 6 | 0 | 11 |
| Backend, sin desarrollo | 1 | 4 | 4 | 0 | 9 |
| Frontend, árbol completo | 3 | 19 | 26 | 2 | 50 |
| Frontend, sin desarrollo | 0 | 5 | 3 | 0 | 8 |

El informe HU-19 examina avisos de `proxy-addr` y `body-parser` en Express, dependencias de solicitudes salientes como Axios y `follow-redirects`, avisos de Angular y el estado de `xlsx`. Deja pendientes las correcciones y el reescaneo. La comprobación defensiva debe repetir la auditoría con los mismos alcances, asociar cambio y lockfile a un PR y volver a ejecutar las pruebas de login, filtros, reseñas y exportaciones. Desde cada carpeta con `package-lock.json` se pueden repetir `npm audit --json` y `npm audit --omit=dev --json`.

La revisión encontró rutas de reseñas cuya autenticación necesita reforzarse, JWT almacenados en el navegador y transportados en el retorno OAuth, y un webhook sin autenticación en los archivos versionados. Se documentaron diez pruebas unitarias de sanitización aprobadas y una validación estática de Compose. Falta evidencia específica de autorización, reglas de firewall, Push Protection y comportamiento del flujo de seguridad. El historial tiene una sustitución de credenciales por marcadores. La rotación y la revisión de dumps se registran como tareas de seguridad, y el contenido de credenciales queda fuera de la documentación.

### Protocolo de respuesta y recuperación

~~~mermaid
sequenceDiagram
    participant M as Monitoreo o personal
    participant N as n8n
    participant G as GLPI
    participant T as Responsable técnico
    M->>N: Evento operativo validado
    N->>G: Registra incidente y urgencia
    G->>T: Asignación y seguimiento
    T->>G: Registra contención y corrección
    T->>T: Verifica recuperación y preserva evidencia
    T->>G: Cierre revisado y seguimiento preventivo
~~~

El diagrama describe el recorrido objetivo del ejercicio de seguridad. Para la contingencia, el responsable puede registrar en GLPI el evento si falla la vía automatizada. El protocolo de HU-19 adapta el ciclo de respuesta al entorno académico.

1. **Detección y clasificación.** Confirmar el alcance con registros de aplicación, infraestructura, dependencia o proveedor. Preservar fecha, SHA, servicio afectado y señales pertinentes. Abrir y asignar un incidente.
2. **Contención.** Aislar el acceso o componente afectado de forma proporcional, conservar evidencia y solicitar aprobación humana para cambios que interrumpan servicios compartidos.
3. **Erradicación.** Corregir el origen, rotar credenciales comprometidas cuando corresponda y asociar PR, pruebas y reescaneo al ticket.
4. **Recuperación.** Verificar que la aplicación funcione, contrastar integridad y observar métricas. Ante daño de datos, restaurar primero en un entorno aislado según el capítulo 15 y validar antes de decidir una recuperación del servicio.
5. **Lecciones aprendidas.** Registrar cronología, causa, duración, evidencias y responsables de controles preventivos. Revisar el cierre y actualizar la matriz.

Para demostrar la integración se requiere un ejercicio defensivo controlado, sin datos reales, con el identificador de ejecución n8n y su ticket, evidencia de asignación, diagnóstico, recuperación y cierre. El ticket histórico de la HU-16 y la prueba de alerta de la HU-18 aportan antecedentes. La validación específica de seguridad de punta a punta sigue pendiente.

[Análisis HU-19](docs/historias_usuario/HU-19-SEGURIDAD.md) · [PR #26](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08/pull/26) · [Pruebas de sanitización](backend/test/sanitize.test.js) · [Corrección de valores en la plantilla](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08/commit/734a754)

## 15. Backup y restauración verificada

El servicio `backups` se conecta por SQL a HAProxy y usa `pg_dump --format=custom --compress=gzip:6`. El contenedor corre como usuario `postgres`. El script toma un bloqueo para evitar copias simultáneas, escribe primero un archivo parcial, comprueba que el archivo sea legible por `pg_restore --list` y genera un manifiesto SHA-256. El scheduler produce una primera copia al arrancar y espera 86.400 s tras cada ejecución con la configuración predeterminada. Retiene siete días y aplica la limpieza después de una generación satisfactoria. El volumen `backup-data` conserva el dump y el manifiesto.

~~~powershell
docker compose ps -a backup-permissions backups
docker compose logs --tail 30 backups
docker compose exec -T backups ls -lh /backups
~~~

### Restauración en laboratorio

1. Crear el proyecto de prueba aislado descrito en HU-07 con los Compose base y de laboratorio. Comprobar que el origen usa un volumen nuevo del proyecto de prueba. El seed inicial opera sobre datos sintéticos.
2. Generar el respaldo y conservar el nombre del archivo que figura en el registro `SUCCESS`. Congelar las escrituras del origen durante la comparación.
3. Ejecutar `restore.hu04.sh` en el contenedor de prueba con el dump elegido. El script invoca `restore.sh` con un servidor de destino aislado y una base nueva de nombre `hu07_restore_…`. Verifica tamaño, SHA-256 y tabla de contenidos, luego restaura en una transacción. La credencial del destino se toma del entorno.
4. Comparar conteos de las seis tablas, definiciones de restricciones y huella de una muestra de reseñas. Guardar tiempos, registros y salida de comparación con el SHA. El procedimiento documentado conserva el destino para inspección y el script rechaza una base existente. Al cerrar el ensayo, retirar únicamente el entorno temporal conforme al procedimiento de laboratorio.

| Prueba documentada | Respaldo | Restauración e integridad |
|---|---|---|
| 08/11/2026, Compose de prueba HU-04/HU-07 | Dos copias de 134.473.355 bytes, en 19 s y 18 s. | Segunda copia restaurada en **43 s** incluyendo checksum y creación de la base. Coincidieron los conteos del dataset de **6.045.000 filas**, diez definiciones de restricciones y la huella de 1.000 reseñas. |
| Prueba posterior a la integración de backups en el Compose principal | Copias del mismo tamaño, en 25 s y 18 s. | Restauración en **36 s**, con los mismos conteos, restricciones y huella. |
| 15/11/2026, clúster Patroni | Dump de **127.396.993 bytes** a través de HAProxy. | Evidencia de generación a través del proxy. Para el cierre operativo conviene ejecutar la prueba aislada sobre una copia producida por el clúster elegido para la entrega. |

El checksum detecta cambios en el archivo respecto del manifiesto. La restauración y comparación suministran evidencia adicional de que el respaldo es utilizable. El alcance es lógico y de una base. La prueba no incluye roles globales, cifrado, copia externa ni recuperación a un instante mediante WAL. El intervalo de ejecución y el tiempo medido en laboratorio orientan la recuperación. El RPO y el RTO operativos requieren medir el destino de entrega y sus dependencias.

[Script de respaldo](db-scripts/backups/backup.sh) · [Scheduler](db-scripts/backups/scheduler.sh) · [Restauración](db-scripts/backups/restore.sh) · [Compose de laboratorio](db-scripts/backups/tests/compose.hu04.yml) · [Verificación SQL](db-scripts/backups/tests/verify.hu04.sql) · [Comandos y resultados HU-07](docs/historias_usuario/HU-07-BACKUPS.md)

## 16. Limitaciones conocidas y mejoras futuras

| Hallazgo o límite | Impacto | Trabajo futuro |
|---|---|---|
| Base y HAProxy en un solo host | El failover probado recupera el servicio ante un fallo de nodo. Un fallo del host o proxy afecta todo el recorrido. | Distribuir nodos entre diferentes dominios de fallo, dar redundancia al ingreso SQL y probar pérdida de red y de quórum. Evaluar un operador de PostgreSQL sobre Kubernetes solo si el entorno exige esa orquestación. |
| Respaldo lógico local | Réplicas y backups comparten dominio de fallo. Los tiempos de laboratorio dependen del host y del dataset. | Copia cifrada fuera del host, por ejemplo en un almacenamiento de objetos con retención inmutable, y pruebas periódicas de restauración y recuperación. |
| Volumen de datos y consulta Q6 | Una sola tabla supera seis millones. La agregación global recorrió el conjunto completo y empeoró en el ensayo. | Acreditar alcance del dataset con la cátedra y dimensionar las tablas aplicables. Medir la misma carga tras rediseñar Q6. |
| Entrega y verificación de cambios | El README de arranque sigue describiendo el esquema anterior, la rama predeterminada está en el commit inicial y CI carece de despliegue real. | Publicar la versión de entrega desde la rama acordada, alinear el README con el capítulo 4 y configurar despliegue, SHA verificable, prueba funcional y rollback. |
| Frontend y rutas públicas | La suite real falla al compilar tres pruebas. Nginx reenvía `/juego` a la API y Angular también registra `/juego/:id` como página. Esto puede afectar el acceso directo o la recarga. | Restaurar la ejecución de pruebas en CI, separar rutas de página y de API y verificar navegación y recarga por URL pública. Completar el módulo de pagos solo si pasa a formar parte del alcance acordado. |
| Perímetro y cadena de suministro | Los puertos publicados dependen del firewall. Hay etiquetas flotantes, hallazgos de auditoría pendientes y defaults de laboratorio que deben endurecerse. | Registrar firewall efectivo, eliminar defaults inseguros, rotar credenciales expuestas y fijar imágenes o acciones. Para otro entorno, evaluar un gestor de secretos como Vault y límites de tasa o WAF según el modelo de amenazas. |
| Integraciones y cuotas externas | OAuth, catálogo externo e IA dependen de disponibilidad, credenciales y límites de proveedores. Los flujos requieren activación, credenciales y pruebas. | Verificar cuotas y alarmas, gestionar identidades con mínimo privilegio, endurecer webhooks y centralizar ejecuciones y errores. |
| Cobertura de monitoreo y evidencia operativa | El tablero actual carece de prueba HTTP externa, panel de reinicios y seguimiento de consultas lentas. | Agregar sonda y paneles correspondientes, consolidar evidencia de red externa y repetir la prueba de alertas en el entorno final. |

### Defensa oral

La cátedra prevé aproximadamente **20 minutos**, una demostración en vivo con la aplicación accesible desde Internet y evaluación individual con nota mínima **7**. La defensa debe permitir que los cinco integrantes expliquen sus aportes, las decisiones y el funcionamiento del recorrido completo. Se propone este guion, sujeto a los responsables del tablero del equipo.

| Tiempo | Demostración | Evidencia de referencia |
|---|---|---|
| 3 min | Abrir Funnel desde red externa, recorrer portada, catálogo, filtro y detalle. Mostrar aplicación, frontera Nginx/API y Compose. | Capítulos 1, 2, 4, 5 y 10. |
| 4 min | Consultar conteos y tamaño en pgAdmin, mostrar comparación Q1/Q6 y explicar costos y alcance de la prueba. | Capítulos 6 y 7. |
| 5 min | Mostrar el líder, simular caída del primario en el entorno de demostración, observar promoción y recuperar el endpoint. Explicar respaldo y verificación de restauración aislada. | Capítulos 8 y 15. |
| 4 min | Mostrar el SHA en Actions, el tablero y una alerta controlada. Rastrear su ticket GLPI y un reporte en Nextcloud. | Capítulos 9, 11, 12 y 13. |
| 4 min | Explicar riesgos y controles, mostrar evidencias y terminar con límites técnicos y decisiones pendientes. | Capítulos 14 y 16 y matriz de entregables. |

Reservar el host y la URL de defensa, comprobar los servicios y las credenciales antes de exponer y disponer de capturas, tiempos y registros de cada prueba. La sesión de defensa y sus resultados constituyen evidencia posterior.

## Matriz de entregables de la cátedra

La numeración de esta matriz corresponde a las **15 etapas del enunciado**, mientras que la del cuerpo corresponde a los **16 capítulos exigidos para el informe**. La evidencia de cada etapa se puede abrir desde sus capítulos. El estado se refiere al alcance registrado a la fecha de corte.

| Punto de la consigna | Entregables y ubicación en este informe | Estado y verificación faltante |
|---|---|---|
| 1. Selección y diagnóstico | Descripción, funcionalidades y diagnóstico/plan en el capítulo 1. Diagrama inicial en el 2. Inventario del stack en el 3. | Documentados, con enlace al diagnóstico original. |
| 2. Gestión Scrum | Proyecto en Jira o equivalente, Product Backlog, plan de sprints, responsables, criterios de aceptación y seguimiento. El `context.md` local reúne seis sprints, historias y criterios. La trazabilidad Git se indica debajo de esta matriz. | Backlog y plan disponibles en el entorno local. Queda por aportar el tablero o exportación, asignaciones, fechas, estados, evidencias de reuniones y decisiones. |
| 3. Control de versiones | Repositorio público, historial, ramas, PR y revisiones, README inicial. Ver trazabilidad debajo de la matriz y capítulo 9. | Git público, historial, ramas, README y PR comprobados. Revisiones formales de los PR consultados y verificación de ausencia de secretos y datos personales en todo el historial/dumps requieren evidencia adicional. |
| 4. Base y servicios auxiliares | Dockerfiles y Compose (4 y 5), esquema, seed y evidencia de volumen (6), pgAdmin (4 y 6), backup y restauración (15). | Configuración, conteos, tamaño medido y restauración histórica respaldados. Seis millones en `resenas`. Alcance del dataset por tabla y evidencia final de pgAdmin y persistencia por verificar. |
| 5. Optimización SQL | Consultas originales y optimizadas, planes antes y después, índices justificados, mediciones e informe en el capítulo 7. | Comparación documentada. Ocho mejoras y una regresión entre nueve consultas medidas. |
| 6. Clúster y replicación | Diagrama, configuraciones de nodos, evidencia de replicación, prueba de fallo y recuperación, y consistencia y limitaciones en el capítulo 8. | Ensayo del 15/11 documentado para pérdida de un primario y reincorporación. |
| 7. Contenerización web | Contenedores y Compose (4 y 5). Evidencia de comunicación Angular → API → datos y capturas (5, 6 y 8). | Configuración y comprobaciones históricas disponibles. Queda la validación integral y de persistencia en la instancia de entrega. |
| 8. CI/CD | Workflow, ejecución, commit de prueba, evidencia de despliegue y rollback en el capítulo 9. | Build y publicación de imágenes acreditados. Faltan el vínculo del caso negativo a un run bloqueado, ejecución de la suite frontend en CI y despliegue automático verificado en el destino. |
| 9. Publicación externa | Mecanismo de acceso, diagrama de red, definición de Funnel, HTTPS, firewall y análisis de riesgos en capítulos 2 y 10. | Configuración de túnel disponible. Pendientes evidencia externa, URL efectiva del entorno y política de firewall comprobada. |
| 10. Monitoreo | Configuración Prometheus, dashboard Grafana, métricas, reglas y prueba de anomalía en capítulo 11. | Configuración y ensayo de CPU documentados. Completar paneles de aplicación y reinicios, verificar consultas lentas cuando corresponda y conservar evidencia del entorno de entrega. |
| 11. Incidencias | Herramienta, registro, asignación, seguimiento e historial de resoluciones en capítulo 12 y dump GLPI. | Diez tickets cerrados. La clasificación deja ocho incidencias y dos solicitudes. Quedan dos incidencias reales o reproducibles con cierre para cubrir el mínimo. |
| 12. Nextcloud | Estructura documental, permisos, informes y evidencias centralizadas en capítulo 12. | Estructura y capturas disponibles. Verificar acceso con perfiles autorizados y registrar versión final publicada, permisos y SHA. |
| 13. n8n | Configuración, diagramas de flujos, evidencias de ejecución, registro de errores, pruebas de integración y análisis de riesgos en capítulo 13. | Tres flujos exportados y diagramados. Faltan capturas o registros trazables de ejecución y fallos en la instancia de entrega, además de la autenticación del webhook. |
| 14. Seguridad | Matriz, informe de vulnerabilidades, escaneo y corrección, pruebas, configuración de controles, respuesta y recuperación, y flujo de incidentes n8n en capítulos 10 y 13 a 15. | Auditoría y pruebas de sanitización registradas, con remediación, reescaneo, controles externos y ejercicio integral de seguridad por acreditar. |
| 15. Informe y defensa | Los 16 capítulos están en este archivo. El capítulo 16 contiene el guion de 20 minutos y la matriz referencia manuales y pruebas. | Informe técnico consolidado. Quedan registro de publicación final en Nextcloud, acceso externo en vivo y realización de la defensa individual. |

### Trazabilidad de la entrega

El repositorio público usa `develop` para integración y `main` como rama predeterminada protegida. La revisión del 19/11 constató que `main` conserva el commit inicial y que `develop` incorpora los PR #2 a #25. El PR #26 de seguridad permanece abierto en la referencia usada por este documento. GitHub informa PR obligatorio, una aprobación y comprobaciones requeridas para `main`. Los PR revisados carecen de revisiones formales registradas en GitHub. Los enlaces de cada bloque permiten reconstruir la evidencia de integración.

| Bloque | PR de referencia |
|---|---|
| Diagnóstico, base, datos y contenedores | #2, #3, #4, #5, #7, #9 y #16. |
| Backup, optimización, replicación y failover | #8, #15 y #18. |
| Catálogo, navegación y ajustes integrados | #11, #12, #22 y #25. |
| Pipeline, publicación y monitoreo | #13, #17, #19, #20, #21 y #24. |
| Mesa de ayuda, gestión documental y automatización | #6, #10, #14 y #23. |
| Análisis de seguridad | #26. |

Las cuentas que abrieron los PR permiten identificar aportes para la defensa. La tabla registra la autoría de apertura en GitHub. El tablero del equipo debe acreditar las asignaciones Scrum, el seguimiento y los responsables de cada historia.

| Cuenta en GitHub | Aportes rastreables por PR |
|---|---|
| `RenatoTM05` | Diagnóstico inicial, carga, inicialización, integración full-stack y optimización SQL (#2, #3, #9, #11, #15 y #25, entre otros). |
| `Darian-Balde` | Contenerización web, túnel, observabilidad y ajustes de proxy y tablero (#5, #7, #13, #17, #19, #21 y #24). |
| `Zamu-ai` | PostgreSQL y pgAdmin, y pipeline de integración continua (#4 y #20). |
| `lucassebah-fi` | Formulario y tickets GLPI, Nextcloud y n8n (#6, #10, #14 y #23). |
| `martinnzx` | Backups, clúster y failover, frontend y retorno OAuth, y análisis de seguridad (#8, #18, #22 y #26). |

Para la entrega, identificar el SHA de la aplicación accesible, la rama de integración y el enlace al tablero actualizado. El `context.md` local está excluido por Git. Las asignaciones de roles de GLPI y Nextcloud describen permisos y responsabilidades operativas.

[Repositorio público](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08) · [Commits de integración](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08/commits/develop/) · [Pull requests](https://github.com/RenatoTM05/Herramientas-Informaticas-TP-Final-Grupo-08/pulls?q=is%3Apr) · [README inicial](README.md) · [Política local de exclusión de archivos](.gitignore)
