#!/bin/sh
# Applies supabase/migrations in order, each in one transaction, and records
# them in supabase_migrations.schema_migrations (the table the Supabase CLI
# uses), so a restart only applies new files. The demo data in
# supabase/seed.sql is loaded once, on a database that has never been seeded.
set -eu

run() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }
value() { psql -X -tA -v ON_ERROR_STOP=1 -c "$1"; }

run <<'SQL'
set client_min_messages = warning;
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
create table if not exists supabase_migrations.seed_runs (
  file text primary key,
  applied_at timestamptz not null default now()
);
SQL

applied=0
for file in /supabase/migrations/*.sql; do
  base=$(basename "$file" .sql)
  version=${base%%_*}
  name=${base#*_}
  if [ -n "$(value "select 1 from supabase_migrations.schema_migrations where version = '$version'")" ]; then
    continue
  fi
  echo "Migrasi: $base"
  run --single-transaction -f "$file" \
    -c "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '$name')" >/dev/null
  applied=$((applied + 1))
done
echo "Migrasi baru diterapkan: $applied"

if [ -f /supabase/seed.sql ] && [ -z "$(value "select 1 from supabase_migrations.seed_runs where file = 'seed.sql'")" ]; then
  echo "Mengisi data contoh (seed.sql)"
  run --single-transaction -f /supabase/seed.sql \
    -c "insert into supabase_migrations.seed_runs (file) values ('seed.sql')" >/dev/null
fi

# PostgREST started before the tables existed: make it read the schema again.
run -c "notify pgrst, 'reload schema'" >/dev/null
echo "Database siap."
