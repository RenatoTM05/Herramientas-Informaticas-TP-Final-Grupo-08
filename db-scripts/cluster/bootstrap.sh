#!/bin/sh
set -eu

# Patroni suministra la URL de conexión y PGPASSFILE al primer nodo.
# Durante la carga aún no existe una réplica síncrona.
export PGOPTIONS="-c synchronous_commit=off"
psql --no-psqlrc --set=ON_ERROR_STOP=1 --set=db="$POSTGRES_DB" "$1" <<'SQL'
CREATE DATABASE :"db";
\connect :db
\i /sql/01_schema_init.sql
\i /sql/02_massive_seed_6M.sql
\i /sql/03_create_indexes.sql
CHECKPOINT;
SQL
