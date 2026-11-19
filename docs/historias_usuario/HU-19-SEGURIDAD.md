# HU-19 · Análisis de ciberseguridad, matriz de amenazas y respuesta a incidentes

## 1. Información general y criterios de aceptación

| Campo | Valor |
|---|---|
| Proyecto | Red Social Gamer y Catálogo de Videojuegos con Moderación IA |
| Equipo | Grupo 08 · Herramientas Informáticas Avanzadas |
| Etapa | Fase 6 · Sprint 6 |
| Referencia | Punto 14 de la Práctica Integradora Final 2026 |
| Base del relevamiento | `develop`, commit `173477b`, 19/11/2026 |

El backlog exige una matriz con probabilidad, impacto y controles preventivos y detectivos, un informe consolidado de vulnerabilidades y un protocolo de respuesta validado. La cátedra pide además evidencias de escaneo y corrección, resultados de pruebas controladas, configuración de controles, un procedimiento de recuperación y evidencia del flujo de incidentes integrado con n8n.

Se revisaron Angular, Express, PostgreSQL, Docker Compose, Tailscale Funnel, GitHub Actions, Prometheus, Alertmanager, n8n, GLPI y la integración con Gemini. Se ejecutaron auditorías de npm, pruebas unitarias de sanitización y una validación estática de Compose. Las mitigaciones propuestas quedan para cambios posteriores. La comprobación desde una red externa, las opciones administrativas de GitHub y un nuevo ejercicio integral n8n → GLPI requieren evidencia adicional. [Compose](../../docker-compose.yml) · [Pipeline](../../.github/workflows/ci-cd-pipeline.yml)

## 2. Matriz de amenazas y gestión de riesgos

El riesgo inherente se estima antes de considerar controles. La probabilidad es **baja** cuando el escenario requiere un acceso o condición poco habitual, **media** cuando existe una ruta plausible con prerrequisitos y **alta** cuando el componente está expuesto o la condición se observa directamente en la configuración. El impacto es **bajo** si el efecto es puntual, **medio** si degrada una función o afecta a un grupo de usuarios y **alto** si compromete datos, credenciales, disponibilidad o el host. Se asignan valores 1 a 3 en cada eje. El producto es bajo entre 1 y 2, medio entre 3 y 4, alto entre 6 y 9. Las calificaciones son estimaciones del equipo y se revisan al cambiar la exposición o verificar un control.

| ID | Activo | Amenaza | Prob. | Impacto | Riesgo inherente | Controles preventivos | Controles detectivos y límites |
|---|---|---|---|---|---|---|---|
| R01 | PostgreSQL, volúmenes `pg-cluster-node-*`, histórico `gamer_pgdata` y `backup-data` | Ransomware o destrucción de volúmenes desde el host | Media | Alto | Alto (6) | Aplicados: separación de volúmenes y redes, backups lógicos con retención. Propuesto: copia cifrada fuera del host, acceso restringido y retención protegida | Alertas de disco y Patroni, registros de backups y Flujo 2 de n8n para integridad. Réplicas y copia local comparten el dominio de fallo del host |
| R02 | API de búsqueda y catálogo, BD de prueba | Inyección SQL en filtros y consultas dinámicas sobre el catálogo de una BD con 6 millones de reseñas | Media | Alto | Alto (6) | Aplicado: filtros de catálogo mediante operadores de Sequelize. Propuesto: validar tipos y límites, revisar expresiones SQL literales y reducir permisos de la cuenta de la API | Logs de API y PostgreSQL, métricas de conexiones. Las métricas generales carecen de identificación específica de SQLi |
| R03 | Angular, reseñas y JWT en navegador | XSS en contenido visible o recursos de terceros, con posible exposición del token | Media | Alto | Alto (6) | Aplicado: sanitización en Express y renderizado de texto en Angular. Propuesto: validar el identificador del tráiler antes de confiar en la URL y evaluar una CSP compatible con la app | Suite de sanitización y logs de errores. Falta telemetría específica de CSP |
| R04 | Sesión de Express y entrada federada | CSRF en operaciones que dependen de credenciales enviadas automáticamente por el navegador | Media | Medio | Medio (4) | Aplicado: el JWT de la API se agrega como Bearer de forma explícita. Propuesto: validar el estado del flujo OAuth y revisar origen y atributos de cookies en rutas que usen sesión | Registros de login y auditoría aportan contexto. La detección específica de CSRF queda pendiente |
| R05 | API de reseñas, identidad y reacciones | Suplantación de autor y fallas de autorización sobre acciones u objetos | Alta | Alto | Alto (9) | Aplicado: middleware JWT y RBAC en rutas administrativas. Propuesto: autenticación obligatoria en escrituras de reseñas, identidad derivada del token y autorización de objeto en futuras ediciones | Auditoría administrativa y registros de login. Falta evidencia de auditoría sistemática para escrituras de reseñas |
| R06 | Dependencias, imágenes, runner y GHCR | Dependencias vulnerables o compromiso de cadena de suministro | Alta | Alto | Alto (9) | Aplicados: lockfiles, `npm ci` y barreras de CI. Propuesto: remediar según alcance real, fijar acciones a SHA verificados y revisar imágenes por digest | Auditoría npm manual. El workflow actual carece de una etapa específica de escaneo de dependencias e imágenes |
| R07 | Alertmanager, webhook de n8n y GLPI | Eventos sin autenticar, tickets espurios y saturación del orquestador | Alta | Alto | Alto (9) | Aplicado: n8n publica en loopback como puerto del host. Propuesto: autenticar el emisor, limitar tamaño y frecuencia, validar esquema y deduplicar eventos | Historial de n8n y tickets GLPI. El JSON versionado carece de autenticación de entrada |
| R08 | JWT, OAuth, variables de entorno y repositorio | Fuga de credenciales por commits, dumps, logs o redirecciones | Media | Alto | Alto (6) | Aplicados: `.gitignore` para archivos de entorno y HTTPS en Funnel. Propuesto: credenciales individuales, revisión de dumps, eliminación de valores de respaldo inseguros y verificación de Push Protection | Registros de accesos y avisos del proveedor cuando estén configurados. El estado administrativo de GitHub queda pendiente de verificación |
| R09 | Backend, Gemini y flujo de informes de n8n | Fuga de API key, abuso de cuota o manipulación del contenido enviado al modelo | Media | Alto | Alto (6) | Aplicado: clave del backend desde el entorno y moderación previa a guardar reseñas. Propuesto: claves separadas por entorno, límites por identidad, cuotas y tratamiento de texto y reportes como datos no confiables | Errores de Gemini en la aplicación e historial de n8n. Confirmar alertas de cuota y facturación con el titular del proyecto |
| R10 | Docker, cAdvisor, sockets y host | Escalamiento de privilegios o escape de contenedor | Media | Alto | Alto (6) | Aplicado: backend con usuario `node`. Propuesto: revisar servicios privilegiados, reducir capacidades y acceso a sockets y separar el monitoreo del host de ejecución si corresponde | Métricas de recursos de cAdvisor y logs Docker. Esas señales no clasifican un escape |
| R11 | Funnel, Nginx, Express y PostgreSQL | DoS o DDoS contra el frontend público o endpoints costosos | Media | Alto | Alto (6) | Aplicados: HTTPS y aislamiento de PostgreSQL en Docker. Propuesto: límites de tasa y tamaño, paginación acotada y revisión de puertos del host | CPU, memoria, caída de contenedores y conexiones PostgreSQL. Falta una señal específica de volumen de solicitudes y latencia HTTP |

Fuentes de implementación. [Autorización de reseñas](../../backend/src/routes/resena.route.js) · [Controlador de reseñas](../../backend/src/controllers/resena.controller.js) · [Catálogo](../../backend/src/controllers/juego.controller.js) · [Reglas Prometheus](../../monitoring/prometheus/alert_rules.yml) · [Automatizaciones HU-18](HU-18-N8N-AUTOMATIZACION.md)

## 3. Informe de hallazgos y evaluación de vulnerabilidades

### 3.1 Auditoría de dependencias

Se ejecutaron los siguientes comandos desde `backend/` y desde `frontend/`, con Node.js 24.15.0 y npm 11.12.1. La segunda consulta aproxima el árbol de dependencias de producción del backend. En el frontend, identifica dependencias declaradas para la aplicación. Verificar si una librería termina en el bundle y si la función afectada se usa requiere revisar el build y sus puntos de llamada. La imagen final del frontend sirve estáticos con Nginx, mientras las herramientas de compilación operan en la etapa de build y en CI.

```sh
npm audit --json
npm audit --omit=dev --json
```

| Componente y alcance | Crítica (Critical) | Alta (High) | Moderada (Moderate) | Baja (Low) | Total |
|---|---:|---:|---:|---:|---:|
| Backend, árbol completo | 1 | 4 | 6 | 0 | 11 |
| Backend, sin dependencias de desarrollo | 1 | 4 | 4 | 0 | 9 |
| Frontend, árbol completo | 3 | 19 | 26 | 2 | 50 |
| Frontend, sin dependencias de desarrollo | 0 | 5 | 3 | 0 | 8 |

Los totales son los que informa npm por paquete afectado, incluidos paquetes que heredan un hallazgo transitivo. Pueden agrupar varios avisos o contabilizar un aviso en más de un paquete. La pertenencia al árbol de producción indica dónde queda instalada una versión. La exposición de cada aplicación se evalúa aparte.

| Paquete o grupo | Gravedad en npm | Aplicabilidad en el proyecto | Mitigación propuesta |
|---|---|---|---|
| Backend · `proxy-addr` 2.0.7 | Crítica | Presente bajo Express. El aviso requiere una configuración específica de confianza en proxies. La configuración revisada de Express carece de un ajuste explícito de `trust proxy`, por lo que esa condición queda sin acreditar | Actualizar a una versión corregida mediante la dependencia que lo incorpora y revisar la configuración de auditoría al habilitar confianza en proxies. [Aviso del mantenedor](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) |
| Backend · `body-parser` 2.3.0 | Alta | Presente mediante `express.json()`, que procesa solicitudes antes del enrutamiento. El aviso sobre peticiones comprimidas es relevante para disponibilidad | Priorizar una resolución compatible que instale `body-parser` 2.4.0 o posterior y comprobar el procesamiento legítimo de JSON. [Aviso del mantenedor](https://github.com/advisories/GHSA-27r3-jxmh-p828) |
| Backend · `axios` 1.18.1 y `follow-redirects` 1.16.0 | Alta | Axios participa en llamadas salientes a Twitch e IGDB. Los endpoints de destino están definidos en el código. El alcance de cada aviso depende del adaptador, opciones y redirecciones efectivas | Actualizar dependencias compatibles y repetir pruebas de renovación de token, catálogo y manejo de redirecciones. [Servicio IGDB](../../backend/src/services/igdb.service.js) |
| Backend · `brace-expansion` | Alta | Figura en el árbol de producción. La revisión no identificó llamadas de catálogo que reciban patrones glob del usuario | Actualizar la dependencia que lo introduce y confirmar el árbol resultante |
| Backend · `moment`, `qs`, `sequelize` y `uuid` | Moderada | Presentes en producción. En `uuid` el aviso involucra funciones específicas con búferes de salida. Su alcance en la app queda por verificar | Revisar el uso y actualizar transitivas con una resolución compatible. npm sugirió una degradación mayor de Sequelize para ese hallazgo. Evaluar una corrección soportada y probar el ORM antes de cambiar versiones. [Aviso de uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| Backend · `nodemon` y `minimatch` | Moderada | Hallazgos del árbol completo que desaparecen al omitir desarrollo. Afectan al entorno de trabajo y a procesos de CI que instalan ese árbol | Revisar la resolución de nodemon y sus dependencias sin aplicar degradaciones automáticas |
| Frontend · `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/router`, `@angular/forms` y `@angular/platform-browser` | Alta y moderada | Forman parte del árbol de la aplicación. Algunos avisos de Router requieren SSR. La imagen revisada sirve una SPA estática. En avisos de compilación y sanitización, verificar los componentes y APIs afectados | Actualizar el conjunto Angular en forma coordinada y repetir build, pruebas del navegador y regresiones de catálogo y login. [Dockerfile del frontend](../../frontend/Dockerfile) |
| Frontend · `xlsx` 0.18.5 y `dompurify` | Alta y moderada | El dashboard usa `xlsx` para exportar. Verificar por separado las funciones expuestas por la aplicación y el uso de sanitización en las exportaciones | Evaluar una actualización compatible o reemplazo mantenido. npm no ofreció corrección automática para `xlsx`. Volver a probar exportaciones Excel y PDF. [Dashboard](../../frontend/src/app/pages/dashboard/dashboard.ts) |
| Frontend · `@angular/build`, `piscina` y `proxy-addr` | Crítica | Los tres registros críticos desaparecen con `--omit=dev`. Su ámbito es el build, CI o herramientas de desarrollo. Los registros de severidad baja del frontend también corresponden a herramientas de desarrollo | Actualizar toolchain y dependencias transitivas, revisar sus condiciones de alcance y evitar que los servidores de desarrollo sean accesibles desde redes externas |

Las correcciones de dependencias requieren una tarea posterior. Para acreditar una corrección, ejecutar los dos escaneos sobre el lockfile actualizado, comparar el aviso y la versión resuelta y repetir las pruebas relevantes. Si queda algún aviso, registrar su condición de alcance, el responsable y la decisión tomada.

### 3.2 Hallazgos de aplicación y automatización

| ID | Observación verificada en el repositorio | Prioridad y tratamiento propuesto |
|---|---|---|
| H01 | Las rutas de creación y de likes de reseñas carecen de middleware de autenticación. Para crear una reseña, el controlador puede conservar el `loginId` del cuerpo si falta un token válido. La ruta de edición de reseñas no existe en el router revisado | Alta. Exigir JWT válido, derivar el autor de la identidad autenticada y aplicar autorización de objeto donde corresponda. La prueba de aceptación debe verificar que las escrituras requieren autenticación y que la identidad proviene del servidor |
| H02 | El webhook del Flujo 1 y la salida de Alertmanager carecen de autenticación de aplicación en sus archivos versionados. El flujo toma el primer evento y la conexión a GLPI sigue de forma lineal. Alertmanager también remite eventos resueltos | Alta. Autenticar el emisor, validar el evento, tratar estados resueltos de forma explícita y correlacionar tickets para evitar duplicados. Revisar permisos del usuario técnico de GLPI |
| H03 | Se observaron JWT de dos horas y almacenamiento en `localStorage`. La redirección de OAuth transporta el JWT en una query string. La revisión de código no halló un mecanismo de revocación selectiva de JWT | Alta. Diseñar un intercambio de código de corta duración y validar el destino permitido. Revisar registros y referencias HTTP, y definir revocación explícita para sesiones comprometidas |
| H04 | El listado personalizado de reseñas construye una expresión SQL literal para el orden. El valor obtenido de la query se convierte a entero. En el catálogo se observaron operadores de Sequelize para filtrar | Media. Revisar todos los orígenes de la identidad y parametrizar o usar expresiones del ORM. La revisión estática encontró un punto para endurecer, con explotación de SQLi sin confirmar |
| H05 | cAdvisor ejecuta en modo privilegiado y monta sockets del host. El montaje de solo lectura limita modificaciones al archivo montado. La capacidad de comunicarse con un socket depende de sus permisos y del servicio en escucha | Alta si el contenedor se compromete. Revisar la necesidad de cada montaje, sus permisos y el aislamiento. El backend ya se ejecuta como usuario `node` |
| H06 | La aplicación llama a Gemini para moderar reseñas y el flujo de reportes usa otra integración con IA. La revisión estática carece de evidencia de cuotas configuradas y alertas de consumo | Media. Restringir claves por entorno, aplicar límites a peticiones y verificar el tablero del proveedor. Conservar únicamente los datos necesarios en prompts, informes de IA y registros |

Referencias. [Rutas](../../backend/src/routes/resena.route.js) · [Controladores de reseñas](../../backend/src/controllers/resena.controller.js) y [OAuth](../../backend/src/controllers/auth.controller.js) · [Alertmanager](../../monitoring/alertmanager/alertmanager.yml) · [Exportaciones de n8n](../../n8n/workflows) · [Configuración de contenedores](../../docker-compose.yml)

### 3.3 Perímetro de red

| Superficie | Configuración versionada y alcance |
|---|---|
| PostgreSQL y pgAdmin | HAProxy expone SQL en `127.0.0.1:5433` por defecto y lo enruta a `5432` en Docker. pgAdmin se publica en `127.0.0.1:5050`. Los nodos PostgreSQL y los puertos de control de Patroni y etcd quedan en Docker |
| Métricas y n8n | Prometheus, Alertmanager y n8n enlazan por defecto a loopback en los puertos 9090, 9093 y 5678. Los exportadores se consumen por las redes Docker. Grafana tiene un puerto de host sin enlace explícito a loopback |
| Tailscale y Nginx | Funnel declara HTTPS hacia el frontend. Nginx sirve la SPA y reenvía rutas de aplicación a Express, incluido Swagger. El túnel publica esas rutas a través del mismo origen |
| Otros enlaces al host | Backend, frontend, Grafana, GLPI y Nextcloud tienen mapeos sin interfaz específica en Compose. Su alcance efectivo depende además del firewall, interfaces del host y entorno de despliegue |

La validación `docker compose config --quiet` terminó correctamente y permite respaldar el análisis declarativo. Para acreditar el perímetro en la defensa, registrar una comprobación con el stack activo desde el host y desde una red autorizada externa al host. Verificar la URL HTTPS y que las interfaces administrativas queden limitadas a los orígenes previstos. [Compose](../../docker-compose.yml) · [Funnel](../../tailscale/serve.json) · [Nginx](../../frontend/nginx.conf)

### 3.4 Política de cero secretos y cadena de suministro

- Git ignora archivos `.env` y permite plantillas versionadas. El commit `734a754` documenta el reemplazo de credenciales por valores de ejemplo. Corresponde confirmar con el responsable que los valores históricos quedaron revocados y que los dumps de GLPI y Nextcloud contienen solo datos autorizados para publicación. La inspección de nombres de archivos y del historial de la plantilla tiene un alcance parcial.
- La API pública de GitHub confirmó que el repositorio es público y omitió `security_and_analysis`. Por eso el estado particular de **Secret Scanning** y **Push Protection** queda sin verificar. Solicitar al administrador evidencia redactada en Settings. Secret Scanning identifica secretos compatibles en el repositorio. Push Protection puede bloquear incorporaciones de patrones reconocidos. Los secretos genéricos, como algunas contraseñas o claves propias, requieren revisión complementaria. [Configuración de seguridad de GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository)
- Actions instala desde lockfiles, usa el token nativo del repositorio y condiciona la publicación a jobs previos. El script `test:ci` del frontend imprime un mensaje y las acciones externas se referencian por etiquetas de versión. Se recomienda incorporar escaneo verificable, ejecutar las pruebas reales y reducir la escritura en GHCR al job que publica. [Workflow](../../.github/workflows/ci-cd-pipeline.yml) · [Scripts del frontend](../../frontend/package.json)

## 4. Protocolo de respuesta a incidentes

El procedimiento usa las cinco fases del backlog como guía operativa. NIST SP 800-61 Rev. 3 integra la respuesta en CSF 2.0 y reemplaza la revisión anterior. Para cada incidente, registrar en GLPI la persona coordinadora, el responsable técnico, la aprobación de acciones que afecten disponibilidad y la persona que valida la recuperación. [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)

### Fase 1 · Detección y clasificación

1. Correlacionar la alerta con el horario, servicio, logs y métricas pertinentes. Prometheus evalúa reglas operativas como `CriticalContainerDown` y `PatroniNoLeader`. Tratar la alerta como señal inicial y verificar si corresponde a un incidente de seguridad.
2. Cuando el Flujo 1 está activado y cuenta con credenciales válidas, Alertmanager envía el evento al webhook y n8n abre una sesión en GLPI, crea un ticket y cierra la sesión. El flujo mapea `critical` a urgencia **5, Muy alta**, y `warning` a **4, Alta**. El export versionado está inactivo. Su activación en la instancia y un nuevo ticket de seguridad quedan para la validación de la demo.
3. Asignar un responsable y guardar ID del ticket, instante del evento, servicios afectados, indicios, decisiones y referencias a evidencia redactada. Si falla la automatización, registrar el incidente manualmente en GLPI y revisar la ejecución de n8n por separado.

### Fase 2 · Contención

1. Identificar el contenedor o la cuenta afectados y preservar logs, versión de imagen, estado de volúmenes y marcas de tiempo. Guardar evidencia con acceso restringido. Pedir aprobación humana antes de interrumpir un servicio o cambiar una red compartida.
2. Ante un compromiso confirmado, limitar primero la entrada por el túnel, el proxy o el firewall según el alcance. En Docker, usar `docker compose pause <servicio>` si la prioridad es detener la ejecución y preservar el estado del proceso. Usar `docker compose stop <servicio>` si el responsable aprueba detenerlo. Si se requiere aislamiento de red, restringir el acceso del contenedor afectado y verificar las dependencias antes de cambiar su conectividad. Para PostgreSQL y etcd, confirmar en Patroni el líder, la réplica elegible y el quórum antes de intervenir.
3. En incidentes de sesión, invalidar sesiones centralizadas si el servicio dispone de ese mecanismo. El logout local elimina el token del navegador y los JWT emitidos conservan su vencimiento mientras el backend acepte la misma clave. Si se compromete la clave de firma, rotar `JWT_SECRET` de forma coordinada para invalidar los JWT anteriores y requerir un nuevo login. Revocar credenciales OAuth, Gemini o GLPI en el proveedor correspondiente cuando estén afectadas.

### Fase 3 · Erradicación

1. Identificar la causa y preparar un hotfix de alcance acotado en `fix/*` con revisión por PR. Si el problema proviene de una dependencia o imagen, actualizar desde un origen confiable, revisar la versión resuelta y volver a escanear.
2. Retirar el acceso comprometido, rotar los valores afectados a través del `.env` protegido y de los proveedores, y recrear solo los servicios que deban cargar la nueva configuración. Validar las asociaciones de credenciales entre servicios, incluidos Alertmanager, n8n y GLPI si corresponde.
3. Vincular al ticket el PR, las evidencias del escaneo posterior y las pruebas defensivas. Antes de reabrir el servicio, confirmar que la causa quedó tratada y registrar los riesgos remanentes.

### Fase 4 · Recuperación

1. **Caída de un nodo con datos sanos.** Confirmar el liderazgo en Patroni, el quórum de etcd y que HAProxy alcanza el primario. Verificar la API, una lectura y una escritura autorizadas de prueba y la reincorporación del antiguo primario como réplica. HU-10 documentó una recuperación de la API en **26,9 segundos** en su escenario de prueba. Usar esa medición como antecedente del laboratorio. [Failover HU-10](HU-10-FAILOVER-POSTGRESQL.md)
2. **Corrupción o pérdida de datos.** Aislar la instancia afectada y seleccionar una copia anterior al incidente proveniente de un origen confiable. Comparar SHA-256, revisar el resultado del Flujo 2 y restaurar con el procedimiento de HU-07 en una base aislada. El hash permite comparar el archivo con el valor esperado. Si el archivo y su hash estuvieron bajo el mismo acceso comprometido, la procedencia de la copia requiere verificación adicional. La réplica puede contener los mismos cambios dañinos que el primario.
3. Verificar conteos, restricciones, muestra de datos, roles recreados, conexión de la app y alertas. Obtener aprobación antes de dirigir tráfico al entorno recuperado. Registrar el tiempo real de recuperación y el intervalo de datos recuperados comparado con el último dato válido. [Restauración HU-07](HU-07-BACKUPS.md) · [Verificación de backups HU-18](HU-18-N8N-AUTOMATIZACION.md)

### Fase 5 · Lecciones aprendidas y cierre

Registrar en GLPI cronología, alcance, causa, medidas, tiempo de recuperación, evidencia y tareas preventivas con responsables. Vincular commits o PR y actualizar la matriz. Cerrar el ticket después de que otra persona del equipo confirme la recuperación y quede acordado el seguimiento. [Ciclo de tickets HU-16](HU-16-GLPI-TICKETS.md)

## 5. Guía de evidencias técnicas

Las capturas de HU-19 se incorporan en `docs/images/hu19/`. En cada evidencia registrar fecha, commit, entorno, responsable y resultado. Ocultar valores de tokens, cookies, credenciales, datos personales y cabeceras de autenticación antes de guardar o compartir capturas.

| ID | Archivo sugerido o evidencia existente | Qué acredita | Estado |
|---|---|---|---|
| E01 | `01_audit_backend.png`, `02_audit_frontend.png` | Comandos y comparación de severidades con y sin dependencias de desarrollo | Escaneos ejecutados el 19/11/2026. Resultados en §3.1. Capturas por incorporar |
| E02 | `03_audit_despues_correccion.png` y PR correspondiente | Versión corregida, aviso retirado del árbol y regresiones aprobadas | Pendiente de remediación y reescaneo |
| E03 | `04_perimetro_https_puertos.png` | Funnel con HTTPS y alcance efectivo de puertos desde host y red externa autorizada | Validación declarativa de Compose ejecutada. Evidencia de acceso efectivo pendiente |
| E04 | `05_github_secret_protection.png` | Opciones de Secret Scanning y Push Protection del repositorio | Pendiente de evidencia administrativa |
| E05 | `06_pruebas_controles_aplicacion.png` | Suite de sanitización y verificación de autorización | `npm test` del backend ejecutado con 10 pruebas aprobadas. La suite cubre sanitización. Verificación de autorización pendiente |
| E06 | `07_ejecucion_n8n_seguridad.png`, `08_ticket_glpi_seguridad.png` | Hora, identificador de ejecución, ticket asociado y urgencia correspondiente | HU-18 describe una prueba previa de alerta operativa. Falta incorporar evidencia verificable de un ejercicio de seguridad |
| E07 | [Evidencia HU-10](../images/hu10/failover-compose-oficial.png) y [resultados HU-07](HU-07-BACKUPS.md) | Failover de nodo y restauración aislada con verificación de integridad | Evidencias previas reutilizadas. El ejercicio integral de HU-19 sigue pendiente |

Para el ejercicio integral, elegir un evento sintético en un entorno aislado con n8n y GLPI operativos. Correlacionar una sola alerta crítica con el ID de ejecución y el ticket urgente, luego realizar un ejercicio de mesa de contención, recuperación y cierre. Guardar quién validó cada etapa. Las interrupciones reales y la rotación de credenciales se reservan para incidentes autorizados o pruebas acordadas sobre un entorno descartable.

## 6. Checklist de definición de hecho

- [x] Matriz de amenazas con probabilidad, impacto y controles preventivos y detectivos.
- [x] Informe estático de hallazgos del stack y auditorías de dependencias con severidad y aplicabilidad.
- [x] Procedimiento de detección, contención, erradicación, recuperación y lecciones aprendidas documentado.
- [x] Resultados de las pruebas unitarias de sanitización y validación estática de Compose registrados.
- [ ] Evidencias de corrección y reescaneo disponibles para los hallazgos tratados.
- [ ] Controles del perímetro y configuración administrativa de GitHub verificados en el entorno de entrega.
- [ ] Protocolo validado de punta a punta con ejecución de n8n, ticket GLPI y evidencia de cierre.
- [ ] Documento y evidencias revisados por el equipo e incorporados al Punto 14 del informe maestro.
