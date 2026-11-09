#!/usr/bin/env bash
# Copia lógica de UNA base. No incluye roles globales del clúster.
set -Eeuo pipefail
umask 077
: "${PGHOST:?}" "${PGUSER:?}" "${PGDATABASE:?}" "${PGPASSWORD:?}"
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-5}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-7}"
[[ "$RETENTION" =~ ^[1-9][0-9]*$ ]] || { echo 'ERROR retención inválida' >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
# flock se libera incluso si el proceso falla; evita dos dumps simultáneos.
exec 9>"$BACKUP_DIR/.backup.lock"
flock -n 9 || { echo 'ERROR ya hay un backup en ejecución' >&2; exit 1; }
started=$SECONDS
name="backup_$(date -u +%Y%m%dT%H%M%S)_$$_${RANDOM}.dump"
tmp="$BACKUP_DIR/.$name.partial"
trap 'rm -f -- "$tmp"; echo "ERROR backup incompleto; no publicado" >&2' ERR
trap 'rm -f -- "$tmp"; exit 143' TERM INT
# Tres intentos acotados para fallos transitorios. Nunca se imprime la clave.
ok=false
for attempt in 1 2 3; do
  if pg_dump --no-password --format=custom --compress=gzip:6 --file="$tmp"; then
    ok=true
    break
  fi
  echo "ERROR pg_dump intento=$attempt" >&2
  if (( attempt < 3 )); then sleep 2; fi
done
[[ "$ok" == true ]]
test -s "$tmp"
pg_restore --list "$tmp" >/dev/null
# El checksum detecta cambios accidentales; no reemplaza restaurar y verificar.
checksum=$(sha256sum "$tmp")
printf '%s  %s\n' "${checksum%% *}" "$name" >"$BACKUP_DIR/$name.sha256"
mv -- "$tmp" "$BACKUP_DIR/$name"
bytes=$(stat -c %s "$BACKUP_DIR/$name")
printf '%s SUCCESS file=%s bytes=%s duration_seconds=%s\n' "$(date -u +%FT%TZ)" "$name" "$bytes" "$((SECONDS-started))"
# Solo elimina copias propias antiguas después de generar una copia válida.
while IFS= read -r -d '' old; do
  rm -f -- "$old" "$old.sha256"
done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'backup_*.dump' -mmin "+$((RETENTION*1440))" -print0)
