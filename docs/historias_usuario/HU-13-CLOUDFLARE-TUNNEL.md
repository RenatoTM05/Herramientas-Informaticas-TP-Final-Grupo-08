# Historia de Usuario 13 (HU-13): Publicación segura mediante Cloudflare Tunnel

## Descripción

Como SysAdmin, quiero publicar el frontend en Internet mediante un túnel seguro, sin abrir puertos entrantes en el router ni exponer servicios internos.

## Implementación

Se agregó el servicio `cloudflared` al `docker-compose.yml`. Se conecta únicamente a `app-network`, espera el estado saludable del frontend y ejecuta un túnel administrado remotamente. El tráfico de entrada del túnel se dirige al servicio Compose `http://frontend:80`; el tráfico entre Cloudflare y el origen viaja por la conexión saliente iniciada por `cloudflared`, por lo que no es necesario publicar un puerto del túnel en el host.

El token se inyecta mediante `CLOUDFLARE_TUNNEL_TOKEN`. La variable se agregó a `.env.example` vacía como referencia. No se debe guardar el token real en Git.

## Configuración necesaria en Cloudflare

1. Crear un túnel de tipo **Cloudflared** en el panel de Cloudflare y copiar su token.
2. Configurar `CLOUDFLARE_TUNNEL_TOKEN` en el `.env` local o en el entorno de despliegue; no compartirlo ni versionarlo.
3. En la configuración del túnel, agregar una ruta pública con el hostname elegido, por ejemplo `juegos.ejemplo.com`, y como servicio de origen `http://frontend:80`.
4. Iniciar o recrear el servicio: `docker compose up -d cloudflared`.
5. Verificar `docker compose ps`, revisar `docker compose logs cloudflared` y abrir el hostname desde una red externa. Confirmar certificado HTTPS válido y que la aplicación cargue correctamente.

Cloudflare gestiona el certificado HTTPS del hostname público. La conexión desde `cloudflared` al contenedor frontend ocurre dentro de la red Docker; el frontend sirve HTTP internamente. No se configuró TLS de origen, ya que el origen es una red privada Docker y el túnel cifra el tramo público hasta la red de Cloudflare.

## Alcance y comprobación pendiente

La configuración evita publicar puertos adicionales del túnel y no incorpora PostgreSQL, pgAdmin ni métricas como destinos públicos. Los puertos que ya publique el Compose para otros servicios no se eliminan; deben permanecer protegidos por la configuración del router/firewall y no deben agregarse como rutas públicas del túnel.

La verificación de acceso público requiere un túnel y un hostname configurados en una cuenta Cloudflare, además del token local. Esos datos no están incluidos en el repositorio, por lo que la comprobación externa y su evidencia visual deben completarse en el entorno del equipo.

## Evidencias a incorporar

Guardar capturas en `docs/images/hu13/` que muestren: el frontend accesible desde una red externa con HTTPS, el servicio `cloudflared` activo y la ruta pública configurada apuntando a `http://frontend:80`. No incluir el token en capturas ni registros.

## Criterios de aceptación

- [x] Servicio Cloudflare Tunnel agregado a Compose y conectado al frontend por la red interna.
- [x] Token externo parametrizado sin incluir secretos en el repositorio.
- [x] No se publica un puerto entrante para `cloudflared`.
- [ ] Acceso HTTPS probado desde una red externa y evidencia guardada (requiere configuración de cuenta/hostname/token del equipo).
- [ ] Confirmar que los servicios administrativos y de métricas no se exponen públicamente.
