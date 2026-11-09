#!/usr/bin/env bash
# Usar únicamente con el Compose de prueba y datos sintéticos de HU-06.
set -Eeuo pipefail
: "${RESTORE_TEST_PASSWORD:?}"
file="${1:?Indicar el .dump generado automáticamente después de cargar HU-06}"
target="hu07_restore_hu04_$(date -u +%s)_$RANDOM"
started=$SECONDS
PGHOST=restore PGPASSWORD="$RESTORE_TEST_PASSWORD" bash /scripts/restore.sh "$file" "$target"
echo "Restauración verificada por pg_restore en $((SECONDS-started)) s"

source_result=$(psql -XAt --no-password -v ON_ERROR_STOP=1 -f /scripts/tests/verify.hu04.sql)
restored_result=$(PGHOST=restore PGPASSWORD="$RESTORE_TEST_PASSWORD" PGDATABASE="$target" \
  psql -XAt --no-password -v ON_ERROR_STOP=1 -f /scripts/tests/verify.hu04.sql)
diff -u <(printf '%s\n' "$source_result") <(printf '%s\n' "$restored_result")
printf '%s\n' "$restored_result"
echo "PASS HU-04 + HU-07: conteos, muestra de reseñas y restricciones coinciden en $target"
