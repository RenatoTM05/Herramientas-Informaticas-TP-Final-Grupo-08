#!/bin/sh
set -eu

: "${PATRONI_SUPERUSER_PASSWORD:?Definir POSTGRES_PASSWORD en .env}"
: "${PATRONI_REPLICATION_PASSWORD:?Definir PATRONI_REPLICATION_PASSWORD en .env}"

# El volumen nuevo se monta con propietario root. Patroni opera como postgres.
install -d -o postgres -g postgres -m 0700 "$PGDATA"
exec gosu postgres patroni /etc/patroni.yml
