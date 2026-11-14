# Historia de Usuario 13 (HU-13): Publicación segura mediante Tailscale Funnel

## Descripción

Como SysAdmin, quiero publicar el frontend en Internet mediante un túnel seguro, sin abrir puertos entrantes en el router ni exponer servicios internos.

## Implementación

Se reemplazó el servicio `cloudflared` por `tailscale` en `docker-compose.yml`. El contenedor se une a la red interna de la aplicación y espera a que el frontend esté saludable. La identidad de Tailscale se conserva en el volumen nombrado `gamer_tailscale_state`, evitando registrar un dispositivo nuevo en cada recreación.

La clave de autenticación se lee desde `TS_AUTHKEY` en `.env`; la variable de ejemplo está vacía en `.env.example`. No guardar ni compartir la clave. El contenedor no publica puertos en el host. Después de su primer inicio, Serve/Funnel se configura una vez mediante la CLI dentro del contenedor, usando el servicio interno `http://frontend:80` como origen.

## Configuración inicial

1. En la consola de administración de Tailscale, crear una auth key para un dispositivo persistente (opción **Ephemeral** desactivada). La clave no necesita ser reusable: el volumen conserva el estado de la máquina.
2. Guardar la clave localmente en `.env` como `TS_AUTHKEY=...`. No incluirla en Git.
3. Desde la raíz del proyecto, ejecutar `docker compose up -d tailscale`.
4. En **Machines** de la consola, comprobar que aparece `gamer-frontend`.
5. Habilitar MagicDNS y HTTPS en la configuración DNS del tailnet. En la política de acceso, permitir Funnel para el nodo si la consola lo solicita. Funnel requiere esas capacidades y un nombre DNS `*.ts.net`.
6. Configurar Serve y Funnel dentro del contenedor:

   ```powershell
   docker compose exec tailscale tailscale serve --bg http://frontend:80
   docker compose exec tailscale tailscale funnel --bg 443
   ```

7. Consultar `docker compose exec tailscale tailscale funnel status` para obtener el hostname HTTPS asignado y abrirlo desde una red externa.

La configuración de Serve/Funnel queda asociada al estado persistente de Tailscale. Si se elimina el volumen `gamer_tailscale_state`, el contenedor tendrá que autenticarse de nuevo y repetir la configuración.

## Seguridad y alcance

Funnel hace público el servicio HTTP que se le indique, protegido por HTTPS desde Tailscale. En esta implementación, el destino es solo el frontend (`frontend:80`). No configurar PostgreSQL, pgAdmin, GLPI ni endpoints de métricas como destinos públicos. Compose no publica puertos para el contenedor Tailscale y no se requiere abrir puertos en el router.

## Evidencias a incorporar

Guardar capturas en `docs/images/hu13/` que muestren el hostname `*.ts.net` abriendo el frontend desde una red externa, el nodo `gamer-frontend` conectado y el estado activo de Funnel. No incluir la auth key en capturas ni registros.

## Criterios de aceptación

- [x] Cliente Tailscale agregado a Compose, conectado a la red interna y con estado persistente.
- [x] Auth key parametrizada mediante variable de entorno sin incluir el secreto en el repositorio.
- [x] El contenedor Tailscale no publica puertos entrantes en el host.
- [ ] Serve/Funnel habilitado en el tailnet y frontend accesible por HTTPS desde una red externa.
- [ ] Verificar y documentar que los servicios administrativos y de métricas no están expuestos públicamente.
