#!/usr/bin/env bash
# Destino configurable separado del origen. Nunca borra una base existente.
set -Eeuo pipefail
umask 077
started=$SECONDS
: "${PGHOST:?}" "${PGUSER:?}" "${PGPASSWORD:?}"
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-5}"
file="${1:?Indicar ruta al .dump}"
target="${2:?Indicar base temporal hu07_restore_...}"
[[ "$target" =~ ^hu07_restore_[a-z0-9_]+$ ]] || { echo 'ERROR nombre de base temporal inválido' >&2; exit 1; }
[[ "$target" != "${PGDATABASE:-}" ]] || exit 1
file=$(realpath "$file")
test -s "$file"
cd "$(dirname "$file")"
# Verifica el archivo solicitado sin confiar en rutas dentro del manifiesto.
read -r expected _ <"$file.sha256"
actual=$(sha256sum "$file")
[[ "$expected" =~ ^[0-9a-f]{64}$ && "$expected" == "${actual%% *}" ]] || { echo 'ERROR checksum inválido' >&2; exit 1; }
pg_restore --list "$file" >/dev/null
# createdb falla si ya existe. No hay --clean ni DROP DATABASE.
createdb --no-password --maintenance-db=postgres --template=template0 "$target"
pg_restore --no-password --exit-on-error --single-transaction --no-owner --no-privileges --dbname="$target" "$file"
echo "SUCCESS restauración completada en $target duration_seconds=$((SECONDS-started)); verificar datos antes de darla por válida"
