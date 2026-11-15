FROM postgres:16-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3-venv \
    && python3 -m venv /opt/patroni \
    && /opt/patroni/bin/pip install --no-cache-dir 'patroni[etcd3,psycopg3]==4.1.5' \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/patroni/bin:${PATH}" \
    PGDATA=/var/lib/postgresql/data/pgdata

COPY patroni.yml /etc/patroni.yml
COPY --chmod=755 start-patroni.sh bootstrap.sh /usr/local/bin/

ENTRYPOINT ["start-patroni.sh"]
