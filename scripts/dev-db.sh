#!/usr/bin/env bash
# Private PostgreSQL 16 instance for local development (no sudo, no Docker).
# Data lives in ~/.local/share/honeybee-pg and listens on localhost:5433.
#   scripts/dev-db.sh start | stop | status
# First run creates the cluster with user/password "honeybee" and database "honeybee".
set -euo pipefail
DIR="${HONEYBEE_PG_DIR:-$HOME/.local/share/honeybee-pg}"
BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PORT="${HONEYBEE_PG_PORT:-5433}"

init() {
  mkdir -p "$DIR/run"
  if [ ! -f "$DIR/data/PG_VERSION" ]; then
    echo honeybee > "$DIR/pw"
    "$BIN/initdb" -D "$DIR/data" -U honeybee --pwfile="$DIR/pw" -A scram-sha-256 -E UTF8 --locale=C.UTF-8 >/dev/null
    rm -f "$DIR/pw"
    FRESH=1
  fi
}

case "${1:-start}" in
  start)
    init
    "$BIN/pg_ctl" -D "$DIR/data" status >/dev/null 2>&1 || "$BIN/pg_ctl" -D "$DIR/data" -l "$DIR/server.log" -o "-p $PORT -k $DIR/run -c listen_addresses=localhost" start >/dev/null
    if [ "${FRESH:-0}" = 1 ]; then sleep 2; PGPASSWORD=honeybee psql -h localhost -p "$PORT" -U honeybee -d postgres -c "CREATE DATABASE honeybee" >/dev/null; fi
    echo "Dev database running: postgresql://honeybee:honeybee@localhost:$PORT/honeybee"
    ;;
  stop) "$BIN/pg_ctl" -D "$DIR/data" stop ;;
  status) "$BIN/pg_ctl" -D "$DIR/data" status ;;
  *) echo "usage: $0 start|stop|status"; exit 1 ;;
esac
