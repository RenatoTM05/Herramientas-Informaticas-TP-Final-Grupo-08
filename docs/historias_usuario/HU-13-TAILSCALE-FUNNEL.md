# Historia de Usuario 13 (HU-13): Publicación segura mediante Tailscale Funnel

## Descripción

Como SysAdmin, quiero publicar automáticamente el frontend en Internet mediante un túnel seguro, sin abrir puertos entrantes en el router ni exponer servicios internos.

## Implementación

El servicio `tailscale` del `docker-compose.yml` se conecta a `app-network`, espera a que el frontend esté saludable y conserva su identidad en el volumen nombrado `gamer_tailscale_state`. Su hostname incorpora el nombre de equipo para que varios integrantes puedan levantar el proyecto en el mismo tailnet sin competir por el mismo nombre.

La clave de autenticación se lee desde `TS_AUTHKEY` en `.env`. La variable de referencia está vacía en `.env.example`; el secreto no se versiona. El archivo `tailscale/serve.json`, montado mediante `TS_SERVE_CONFIG`, configura automáticamente Funnel HTTPS para enviar las solicitudes a `http://frontend:80`. El hostname del tailnet se resuelve con `${TS_CERT_DOMAIN}` para que no haya que fijar el nombre del tailnet en el repositorio.

## Configuración inicial del equipo

Un administrador debe configurar una sola vez el tailnet:

1. Habilitar MagicDNS y HTTPS certificates en la sección DNS.
2. Autorizar Funnel para los dispositivos del tailnet, siguiendo el flujo que ofrece Tailscale.
3. Distribuir el `.env` al equipo por un canal privado. No subirlo al repositorio ni pegar la clave en issues, chats públicos o capturas.

En cada computadora, un integrante coloca la auth key compartida en `TS_AUTHKEY` del `.env` local y ejecuta:

```powershell
docker compose up -d
```

Al registrarse el contenedor, Tailscale toma la configuración declarada en `tailscale/serve.json`. Cada máquina obtiene su hostname `gamer-frontend-<equipo>.<tailnet>.ts.net`; el resultado se puede consultar con:

```powershell
docker compose exec tailscale tailscale funnel status
```

La auth key debe ser reusable si se compartirá para registrar dispositivos de varios integrantes. El estado local se conserva en el volumen `gamer_tailscale_state`. `docker compose down` lo mantiene; `docker compose down -v` lo elimina, y en ese caso el dispositivo debe autenticarse de nuevo.

## Seguridad y alcance

Funnel hace público el frontend configurado en `serve.json`, con HTTPS gestionado por Tailscale. Solo se publica `http://frontend:80`; no agregar PostgreSQL, pgAdmin, GLPI ni métricas como destinos. El servicio Tailscale no publica puertos del host y no requiere apertura de puertos entrantes en el router.

El enlace pertenece al dispositivo que hospeda ese contenedor. Solo estará disponible mientras la computadora esté encendida, conectada a Internet y Docker mantenga activos los servicios. Cada integrante obtiene un hostname propio; no hay failover automático entre las computadoras.

## Evidencias a incorporar

Guardar capturas en `docs/images/hu13/` que muestren, desde una red externa, el hostname `*.ts.net` con el frontend, los dispositivos conectados y Funnel activo. No mostrar la auth key.

## Criterios de aceptación

- [x] Cliente Tailscale integrado a Compose con estado persistente.
- [x] Serve/Funnel configurados declarativamente en `tailscale/serve.json`.
- [x] Auth key parametrizada y excluida del repositorio.
- [x] No se publican puertos entrantes del host para el túnel.
- [ ] Cada integrante completa la autenticación inicial y verifica su hostname HTTPS desde una red externa.
- [ ] Evidencias externas guardadas y servicios administrativos/métricas confirmados como no públicos.
