#!/usr/bin/env bash
set -Eeuo pipefail
interval="${BACKUP_INTERVAL_SECONDS:-86400}"
[[ "$interval" =~ ^[1-9][0-9]*$ ]] || { echo 'ERROR intervalo inválido' >&2; exit 1; }
child=''
trap 'if [[ -n "$child" ]]; then kill -TERM "$child" 2>/dev/null || true; wait "$child" || true; fi; exit 0' TERM INT
echo "Temporizador activo: UTC, intervalo=${interval}s después de cada ejecución"
while true; do
  bash /scripts/backup.sh & child=$!
  if ! wait "$child"; then echo 'ERROR ejecución fallida; se reintentará en el siguiente ciclo' >&2; fi
  sleep "$interval" & child=$!
  wait "$child"
done
