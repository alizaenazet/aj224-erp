-- Import history (UMM-13, change: add-data-import). Rows are written by the
-- import route under the importing user's own session.

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  template text not null check (template ~ '^[a-z][a-z0-9-]*$'),
  file_name text not null,
  total_rows integer not null check (total_rows >= 0),
  imported_rows integer not null check (imported_rows >= 0),
  failed_rows integer not null check (failed_rows >= 0),
  -- First failures only: [{ row, column, message }].
  errors jsonb not null default '[]'::jsonb,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index import_runs_created_idx on public.import_runs (created_at desc);

alter table public.import_runs enable row level security;
revoke all on table public.import_runs from anon;
revoke update, delete on table public.import_runs from authenticated;

create policy "Users record their imports" on public.import_runs
  for insert to authenticated
  with check ((select public.is_active_user()) and created_by = (select auth.uid()));

create policy "Users read their imports; Super Admin and Direktur read all" on public.import_runs
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.has_role('super_admin', 'director'))
  );
