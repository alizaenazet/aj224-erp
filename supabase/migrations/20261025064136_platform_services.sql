-- Platform services: audit log, notifications, document numbering, delete
-- guard, daily scheduled checks. PRD UMM-06, UMM-08, UMM-10, UMM-11, §15
-- (change: add-platform-services).

-- ---------------------------------------------------------------------------
-- Today in WIB: every date rule uses this, never current_date.
-- ---------------------------------------------------------------------------
create or replace function public.today_wib()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Jakarta')::date
$$;

-- ---------------------------------------------------------------------------
-- Audit log (UMM-08)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('insert', 'update', 'cancel', 'override')),
  -- No FK: an audit write must never fail; actor may be null (Sistem).
  actor_id uuid,
  created_at timestamptz not null default now(),
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  reason text
);

comment on table public.audit_log is
  'Who changed what and when for opted-in tables (UMM-08). Written only by triggers and system functions.';

create index audit_log_record_idx on public.audit_log (table_name, record_id, created_at desc);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- Attach AFTER INSERT OR UPDATE. Optional TG_ARGV[0]: key column (default id).
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  key_column text := coalesce(tg_argv[0], 'id');
  new_row jsonb := to_jsonb(new);
  old_row jsonb;
  field text;
  changed text[] := '{}';
  old_vals jsonb := '{}';
  new_vals jsonb := '{}';
  audit_action text := 'insert';
  audit_reason text;
begin
  if tg_op = 'INSERT' then
    new_vals := new_row - 'created_at' - 'updated_at';
  else
    audit_action := 'update';
    old_row := to_jsonb(old);

    for field in select jsonb_object_keys(new_row) loop
      continue when field = 'updated_at';
      if (old_row -> field) is distinct from (new_row -> field) then
        changed := changed || field;
        old_vals := old_vals || jsonb_build_object(field, old_row -> field);
        new_vals := new_vals || jsonb_build_object(field, new_row -> field);
      end if;
    end loop;

    if cardinality(changed) = 0 then
      return null;
    end if;

    if new_row ? 'cancelled_at'
       and old_row ->> 'cancelled_at' is null
       and new_row ->> 'cancelled_at' is not null then
      audit_action := 'cancel';
      audit_reason := new_row ->> 'cancel_reason';
    end if;
  end if;

  insert into public.audit_log
    (table_name, record_id, action, actor_id, old_values, new_values, changed_fields, reason)
  values (
    tg_table_name,
    new_row ->> key_column,
    audit_action,
    auth.uid(),
    nullif(old_vals, '{}'::jsonb),
    new_vals,
    nullif(changed, '{}'),
    audit_reason
  );

  return null;
end;
$$;

-- Explicit events (e.g. overrides) logged from module functions.
create or replace function public.log_audit_event(
  p_table_name text,
  p_record_id text,
  p_action text,
  p_reason text,
  p_data jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (table_name, record_id, action, actor_id, new_values, reason)
  values (p_table_name, p_record_id, p_action, auth.uid(), p_data, p_reason)
$$;

alter table public.audit_log enable row level security;
revoke all on table public.audit_log from anon;
revoke insert, update, delete on table public.audit_log from authenticated;

create policy "Super Admin and Direktur read the audit log"
on public.audit_log
for select
to authenticated
using ((select public.has_role('super_admin', 'director')));

-- ---------------------------------------------------------------------------
-- Notifications (UMM-06)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  category text not null default 'system',
  title text not null,
  body text,
  link text check (link is null or link like '/%'),
  dedupe_key text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, dedupe_key)
);

comment on table public.notifications is
  'In-app notifications (UMM-06). Created only by system functions; users may only mark their own as read.';

create index notifications_recipient_idx
  on public.notifications (recipient_id, read_at, created_at desc);

create or replace function public.notify_user(
  p_recipient_id uuid,
  p_category text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_dedupe_key text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, category, title, body, link, dedupe_key)
  select p.id, p_category, p_title, p_body, p_link, p_dedupe_key
  from public.profiles p
  where p.id = p_recipient_id
    and p.is_active
  on conflict (recipient_id, dedupe_key) do nothing
$$;

create or replace function public.notify_roles(
  p_roles public.app_role[],
  p_category text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_dedupe_key text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, category, title, body, link, dedupe_key)
  select p.id, p_category, p_title, p_body, p_link, p_dedupe_key
  from public.profiles p
  where p.role = any (p_roles)
    and p.is_active
  on conflict (recipient_id, dedupe_key) do nothing
$$;

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon;
revoke insert, update, delete on table public.notifications from authenticated;
grant update (read_at) on table public.notifications to authenticated;

create policy "Users read their own notifications"
on public.notifications
for select
to authenticated
using (recipient_id = (select auth.uid()));

create policy "Users mark their own notifications read"
on public.notifications
for update
to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Document numbering (UMM-10)
-- ---------------------------------------------------------------------------
create table public.document_types (
  code text primary key,
  label text not null,
  format text not null check (format ~ '\{SEQ:[0-9]+\}'),
  reset_period text not null check (reset_period in ('month', 'year', 'never')),
  updated_at timestamptz not null default now()
);

comment on table public.document_types is
  'Number format per document type (UMM-10). Tokens: {YYYY} {YY} {MM} {SEQ:n}.';

create trigger document_types_set_updated_at
before update on public.document_types
for each row execute function public.set_updated_at();

insert into public.document_types (code, label, format, reset_period) values
  ('tender',        'Tender',      'TND/AJ224/{YYYY}/{SEQ:3}',      'year'),
  ('project',       'Proyek',      'PRJ/AJ224/{YYYY}/{SEQ:3}',      'year'),
  ('invoice',       'Invoice',     'INV/AJ224/{YYYY}/{MM}/{SEQ:3}', 'month'),
  ('delivery_note', 'Surat Jalan', 'SJ/AJ224/{YYYY}/{MM}/{SEQ:3}',  'month'),
  ('incident',      'Insiden K3',  'K3/AJ224/{YYYY}/{SEQ:3}',       'year');

create table public.document_sequences (
  doc_type text not null references public.document_types (code),
  period_key text not null,
  last_value integer not null check (last_value > 0),
  primary key (doc_type, period_key)
);

create or replace function public.next_document_number(
  p_doc_type text,
  p_doc_date date default public.today_wib()
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  doc public.document_types;
  key text;
  seq integer;
  digits integer;
  result text;
begin
  select * into doc from public.document_types where code = p_doc_type;
  if not found then
    raise exception 'Jenis dokumen tidak dikenal: %', p_doc_type;
  end if;

  key := case doc.reset_period
    when 'month' then to_char(p_doc_date, 'YYYY-MM')
    when 'year' then to_char(p_doc_date, 'YYYY')
    else 'all'
  end;

  -- The upsert row lock serializes concurrent callers: no duplicates.
  insert into public.document_sequences (doc_type, period_key, last_value)
  values (p_doc_type, key, 1)
  on conflict (doc_type, period_key)
  do update set last_value = public.document_sequences.last_value + 1
  returning last_value into seq;

  result := doc.format;
  result := replace(result, '{YYYY}', to_char(p_doc_date, 'YYYY'));
  result := replace(result, '{YY}', to_char(p_doc_date, 'YY'));
  result := replace(result, '{MM}', to_char(p_doc_date, 'MM'));

  digits := (regexp_match(result, '\{SEQ:([0-9]+)\}'))[1]::integer;
  result := regexp_replace(
    result,
    '\{SEQ:[0-9]+\}',
    case when length(seq::text) >= digits then seq::text else lpad(seq::text, digits, '0') end
  );

  return result;
end;
$$;

alter table public.document_types enable row level security;
alter table public.document_sequences enable row level security;
revoke all on table public.document_types from anon;
revoke all on table public.document_sequences from anon, authenticated;
revoke insert, delete on table public.document_types from authenticated;

create policy "Signed-in users read document types"
on public.document_types
for select
to authenticated
using (true);

create policy "Super Admin edits document formats"
on public.document_types
for update
to authenticated
using ((select public.has_role('super_admin')))
with check ((select public.has_role('super_admin')));

-- ---------------------------------------------------------------------------
-- Cancel instead of delete (UMM-11). Transaction tables attach this
-- BEFORE DELETE and add cancelled_at / cancelled_by / cancel_reason.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_hard_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Data transaksi tidak dapat dihapus. Gunakan Batal dengan alasan.';
end;
$$;

-- ---------------------------------------------------------------------------
-- Daily scheduled checks (PRD §15)
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;

create table public.scheduled_checks (
  name text primary key,
  function_name regprocedure not null,
  description text,
  enabled boolean not null default true,
  sort_order integer not null default 100
);

comment on table public.scheduled_checks is
  'Checks run every morning by run_daily_checks(). Modules register theirs in migrations.';

create table public.job_runs (
  id bigint generated always as identity primary key,
  check_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'success', 'failed')),
  message text
);

create index job_runs_started_idx on public.job_runs (started_at desc);

create or replace function public.run_daily_checks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  check_row record;
  run_id bigint;
begin
  for check_row in
    select name, function_name
    from public.scheduled_checks
    where enabled
    order by sort_order, name
  loop
    insert into public.job_runs (check_name, status)
    values (check_row.name, 'running')
    returning id into run_id;

    begin
      -- function_name is a regprocedure: only existing functions, schema-qualified.
      execute 'select ' || check_row.function_name::text;
      update public.job_runs
      set status = 'success', finished_at = now()
      where id = run_id;
    exception when others then
      update public.job_runs
      set status = 'failed', finished_at = now(), message = sqlerrm
      where id = run_id;
    end;
  end loop;
end;
$$;

alter table public.scheduled_checks enable row level security;
alter table public.job_runs enable row level security;
revoke all on table public.scheduled_checks from anon;
revoke all on table public.job_runs from anon;
revoke insert, update, delete on table public.scheduled_checks from authenticated;
revoke insert, update, delete on table public.job_runs from authenticated;

create policy "Super Admin reads scheduled checks"
on public.scheduled_checks
for select
to authenticated
using ((select public.has_role('super_admin')));

create policy "Super Admin reads job runs"
on public.job_runs
for select
to authenticated
using ((select public.has_role('super_admin')));

-- 23:00 UTC = 06:00 WIB
select cron.schedule('aj224-daily-checks', '0 23 * * *', 'select public.run_daily_checks()');

-- ---------------------------------------------------------------------------
-- System-only functions: not callable through the API.
-- ---------------------------------------------------------------------------
revoke execute on function public.log_audit_event(text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.notify_user(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_roles(public.app_role[], text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.next_document_number(text, date) from public, anon, authenticated;
revoke execute on function public.run_daily_checks() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles: audited; Super Admin inserts profiles (so the audit names the inviter).
-- ---------------------------------------------------------------------------
grant insert (id, full_name, email, role) on table public.profiles to authenticated;

create policy "Super Admin inserts profiles"
on public.profiles
for insert
to authenticated
with check ((select public.has_role('super_admin')));

create trigger profiles_audit
after insert or update on public.profiles
for each row execute function public.audit_row_change();
