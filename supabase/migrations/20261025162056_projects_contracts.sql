-- Projects, contracts with addenda, payment terms, budgets (RAB), project
-- documents and tender → project. PRD PRJ-01 … PRJ-04, PRJ-09, PRJ-10,
-- MKT-09, MST-04 (change: add-projects-contracts).

-- ---------------------------------------------------------------------------
-- Projects (PRJ-01) with their own location (MST-04)
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (length(btrim(name)) > 0),
  client_id uuid not null references public.clients (id) on delete restrict,
  tender_id uuid unique references public.tenders (id) on delete restrict,
  end_owner text,
  site text,
  voltage_kv integer check (voltage_kv in (150, 275, 500)),
  length_kms numeric(10, 2) check (length_kms >= 0),
  tower_count integer check (tower_count >= 0),
  start_date date,
  target_finish_date date,
  -- Target after the latest addendum that sets one (PRJ-02), kept here by
  -- triggers so every role that sees the project gets the same date.
  finish_date date,
  status text not null default 'preparing'
    check (status in ('preparing', 'running', 'on_hold', 'completed', 'closed')),
  location_id uuid unique references public.locations (id) on delete restrict,
  notes text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target_finish_date is null or start_date is null or target_finish_date >= start_date)
);

create index projects_client_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- The system issues the code and creates the project location (clients may
-- only create warehouses), so this runs as definer.
create or replace function public.projects_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  location_code text;
begin
  new.code := public.next_document_number('project', coalesce(new.start_date, public.today_wib()));

  location_code := left(
    btrim(regexp_replace(upper(new.code), '[^A-Z0-9]+', '-', 'g'), '-'),
    20
  );
  insert into public.locations (code, name, type)
  values (btrim(location_code, '-'), new.name, 'project')
  returning id into new.location_id;

  return new;
end;
$$;

create trigger projects_before_insert
before insert on public.projects
for each row execute function public.projects_before_insert();

-- MKT-09: only a won tender of the same client becomes a project.
create or replace function public.projects_tender_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tender record;
begin
  if new.tender_id is null then
    return new;
  end if;
  select status, client_id into tender from public.tenders where id = new.tender_id;
  if not found or tender.status <> 'won' then
    raise exception 'Hanya tender Menang yang dapat dijadikan proyek';
  end if;
  if tender.client_id <> new.client_id then
    raise exception 'Klien proyek harus sama dengan klien tender';
  end if;
  return new;
end;
$$;

create trigger projects_tender_guard
before insert or update of tender_id, client_id on public.projects
for each row execute function public.projects_tender_guard();

create trigger projects_audit
after insert or update on public.projects
for each row execute function public.audit_row_change('id');

-- The project name follows into its location.
create or replace function public.projects_sync_location()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.locations set name = new.name where id = new.location_id;
  return null;
end;
$$;

create trigger projects_sync_location
after update of name on public.projects
for each row execute function public.projects_sync_location();

-- ---------------------------------------------------------------------------
-- Contract, addenda (PRJ-02) and payment terms (PRJ-03)
-- ---------------------------------------------------------------------------
create table public.project_contracts (
  project_id uuid primary key references public.projects (id) on delete cascade,
  contract_no text,
  contract_date date,
  contract_value numeric(16, 2) not null default 0 check (contract_value >= 0),
  ppn_applicable boolean not null default true,
  maintenance_months integer check (maintenance_months between 0 and 120),
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger project_contracts_set_updated_at
before update on public.project_contracts
for each row execute function public.set_updated_at();

create trigger project_contracts_audit
after insert or update on public.project_contracts
for each row execute function public.audit_row_change('project_id');

create table public.project_addenda (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  addendum_no text not null check (length(btrim(addendum_no)) > 0),
  addendum_date date not null,
  new_value numeric(16, 2) check (new_value >= 0),
  new_finish_date date,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (new_value is not null or new_finish_date is not null)
);

create unique index project_addenda_no_key on public.project_addenda (project_id, lower(btrim(addendum_no)));

create trigger project_addenda_audit
after insert on public.project_addenda
for each row execute function public.audit_row_change('id');

-- Latest addendum finish date, falling back to the project's own target.
create or replace function public.project_finish_date(p_project uuid, p_target date)
returns date
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select a.new_finish_date
      from public.project_addenda a
      where a.project_id = p_project and a.new_finish_date is not null
      order by a.addendum_date desc, a.created_at desc
      limit 1
    ),
    p_target
  );
$$;

revoke execute on function public.project_finish_date(uuid, date) from public, anon, authenticated;

create or replace function public.projects_set_finish_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.finish_date := public.project_finish_date(new.id, new.target_finish_date);
  return new;
end;
$$;

create trigger projects_set_finish_date
before insert or update of target_finish_date on public.projects
for each row execute function public.projects_set_finish_date();

-- A schedule addendum moves the project's current finish date.
create or replace function public.project_addenda_set_finish_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projects p
  set finish_date = public.project_finish_date(p.id, p.target_finish_date)
  where p.id = new.project_id;
  return null;
end;
$$;

create trigger project_addenda_set_finish_date
after insert on public.project_addenda
for each row when (new.new_finish_date is not null)
execute function public.project_addenda_set_finish_date();

create table public.project_terms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  sort_order integer not null default 1,
  name text not null check (length(btrim(name)) > 0),
  kind text not null check (kind in ('down_payment', 'progress', 'retention')),
  percent numeric(5, 2) check (percent > 0 and percent <= 100),
  amount numeric(16, 2) check (amount >= 0),
  condition_type text not null check (condition_type in ('progress', 'date', 'manual')),
  condition_progress numeric(5, 2) check (condition_progress between 0 and 100),
  condition_date date,
  status text not null default 'not_due' check (status in ('not_due', 'ready', 'invoiced', 'paid')),
  ready_at timestamptz,
  ready_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((percent is null) <> (amount is null)),
  check (condition_type <> 'progress' or condition_progress is not null),
  check (condition_type <> 'date' or condition_date is not null)
);

create index project_terms_project_idx on public.project_terms (project_id, sort_order);

create trigger project_terms_set_updated_at
before update on public.project_terms
for each row execute function public.set_updated_at();

create trigger project_terms_audit
after insert or update on public.project_terms
for each row execute function public.audit_row_change('id');

create or replace function public.project_terms_guard_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'not_due' then
    raise exception 'Termin yang sudah siap ditagih tidak dapat dihapus';
  end if;
  return old;
end;
$$;

create trigger project_terms_guard_delete
before delete on public.project_terms
for each row execute function public.project_terms_guard_delete();

-- ---------------------------------------------------------------------------
-- Budget (RAB) per cost category (PRJ-04)
-- ---------------------------------------------------------------------------
create table public.project_budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  cost_category_id uuid not null references public.cost_categories (id) on delete restrict,
  amount numeric(16, 2) not null default 0 check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, cost_category_id)
);

create trigger project_budgets_set_updated_at
before update on public.project_budgets
for each row execute function public.set_updated_at();

create trigger project_budgets_audit
after insert or update on public.project_budgets
for each row execute function public.audit_row_change('id');

create or replace function public.project_budgets_category_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.cost_categories c where c.id = new.cost_category_id and c.is_overhead) then
    raise exception 'Kategori overhead tidak dipakai di RAB proyek';
  end if;
  return new;
end;
$$;

create trigger project_budgets_category_guard
before insert or update of cost_category_id on public.project_budgets
for each row execute function public.project_budgets_category_guard();

-- ---------------------------------------------------------------------------
-- Shared numbers (security invoker: they follow each caller's RLS)
-- ---------------------------------------------------------------------------
create view public.project_overview
with (security_invoker = true)
as
select
  p.id,
  p.code,
  p.name,
  p.client_id,
  cl.name as client_name,
  p.tender_id,
  p.end_owner,
  p.site,
  p.voltage_kv,
  p.length_kms,
  p.tower_count,
  p.start_date,
  p.target_finish_date,
  p.status,
  p.location_id,
  p.notes,
  p.created_at,
  c.contract_no,
  c.contract_date,
  c.ppn_applicable,
  c.maintenance_months,
  c.scope,
  c.contract_value as base_contract_value,
  -- PRJ-02: the value after the latest addendum that sets one.
  case when c.project_id is null then null else coalesce(av.new_value, c.contract_value) end as contract_value,
  p.finish_date,
  (select count(*) from public.project_addenda a where a.project_id = p.id)::int as addendum_count
from public.projects p
left join public.clients cl on cl.id = p.client_id
left join public.project_contracts c on c.project_id = p.id
left join lateral (
  select a.new_value
  from public.project_addenda a
  where a.project_id = p.id and a.new_value is not null
  order by a.addendum_date desc, a.created_at desc
  limit 1
) av on true;

create view public.project_term_list
with (security_invoker = true)
as
select
  t.*,
  coalesce(t.amount, round(t.percent * o.contract_value / 100, 2)) as amount_value
from public.project_terms t
join public.project_overview o on o.id = t.project_id;

-- Realized cost per project and category (§11.3). Empty until the finance
-- changes replace this view with the union of their cost sources.
create view public.project_category_costs
with (security_invoker = true)
as
select null::uuid as project_id, null::uuid as cost_category_id, 0::numeric as amount
where false;

create view public.project_budget_summary
with (security_invoker = true)
as
select
  o.id as project_id,
  o.contract_value,
  coalesce(b.total_budget, 0) as total_budget,
  o.contract_value - coalesce(b.total_budget, 0) as planned_profit
from public.project_overview o
left join (
  select project_id, sum(amount) as total_budget
  from public.project_budgets
  group by project_id
) b on b.project_id = o.id;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------
-- Project and contract in one transaction; RLS decides who may create.
create or replace function public.create_project(p_project jsonb, p_contract jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_project_id uuid;
begin
  insert into public.projects (
    name, client_id, tender_id, end_owner, site, voltage_kv, length_kms, tower_count,
    start_date, target_finish_date, notes
  )
  select
    r.name, r.client_id, r.tender_id, r.end_owner, r.site, r.voltage_kv, r.length_kms, r.tower_count,
    r.start_date, r.target_finish_date, r.notes
  from jsonb_populate_record(null::public.projects, p_project) r
  returning id into new_project_id;

  insert into public.project_contracts (
    project_id, contract_no, contract_date, contract_value, ppn_applicable, maintenance_months, scope
  )
  select
    new_project_id, r.contract_no, r.contract_date, coalesce(r.contract_value, 0),
    coalesce(r.ppn_applicable, true), r.maintenance_months, r.scope
  from jsonb_populate_record(null::public.project_contracts, p_contract) r;

  return new_project_id;
end;
$$;

revoke execute on function public.create_project(jsonb, jsonb) from public, anon;
grant execute on function public.create_project(jsonb, jsonb) to authenticated;

-- Status changes go through here (audited by the projects trigger).
create or replace function public.set_project_status(p_project uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role('finance', 'operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if p_status = 'closed' then
    raise exception 'Penutupan proyek memerlukan checklist penutupan.';
  end if;
  if p_status not in ('preparing', 'running', 'on_hold', 'completed') then
    raise exception 'Status proyek tidak dikenal.';
  end if;

  update public.projects set status = p_status where id = p_project;
  if not found then
    raise exception 'Proyek tidak ditemukan.';
  end if;
end;
$$;

revoke execute on function public.set_project_status(uuid, text) from public, anon;
grant execute on function public.set_project_status(uuid, text) to authenticated;

-- Internal: a term becomes Siap Ditagih and Finance is told (PRJ-03).
create or replace function public.term_set_ready(p_term uuid, p_by uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  term record;
begin
  update public.project_terms
  set status = 'ready', ready_at = now(), ready_by = p_by
  where id = p_term and status = 'not_due';
  if not found then
    return false;
  end if;

  select t.name, t.amount_value, p.id as project_id, p.code
  into term
  from public.project_term_list t
  join public.projects p on p.id = t.project_id
  where t.id = p_term;

  perform public.notify_roles(
    array['finance']::public.app_role[],
    'term',
    'Termin siap ditagih',
    format('%s · %s · Rp %s', term.code, term.name,
           replace(to_char(coalesce(term.amount_value, 0), 'FM999,999,999,999,990'), ',', '.')),
    '/projects/' || term.project_id || '/contract',
    'term-ready:' || p_term
  );
  return true;
end;
$$;

revoke execute on function public.term_set_ready(uuid, uuid) from public, anon, authenticated;

-- Manual readiness by Finance or Operasional (e.g. after BAST).
create or replace function public.mark_term_ready(p_term uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role('finance', 'operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if not public.term_set_ready(p_term, auth.uid()) then
    raise exception 'Termin tidak ditemukan atau sudah tidak berstatus Belum Waktunya.';
  end if;
end;
$$;

revoke execute on function public.mark_term_ready(uuid) from public, anon;
grant execute on function public.mark_term_ready(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Attachments: project documents (PRJ-10)
-- ---------------------------------------------------------------------------
create or replace function public.attachment_bucket(p_entity_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_entity_type
    when 'employee' then 'employee-files'
    when 'employee_certificate' then 'employee-files'
    when 'tender' then 'marketing-files'
    when 'project' then 'project-files'
  end
$$;

create or replace function public.can_read_attachment(
  p_entity_type text,
  p_entity_id uuid,
  p_category text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case p_entity_type
    when 'employee' then
      exists (select 1 from public.employees e where e.id = p_entity_id)
      and (p_category = 'photo' or public.has_role('hcm', 'director'))
    when 'employee_certificate' then
      exists (select 1 from public.employee_certificates c where c.id = p_entity_id)
    when 'tender' then
      exists (select 1 from public.tenders t where t.id = p_entity_id)
    when 'project' then
      exists (select 1 from public.projects p where p.id = p_entity_id)
      and (
        p_category not in ('contract', 'addendum')
        or public.has_role('super_admin', 'director', 'marketing', 'finance', 'operations')
      )
    else false
  end
$$;

create or replace function public.can_write_attachment(
  p_entity_type text,
  p_entity_id uuid,
  p_category text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case p_entity_type
    when 'employee' then
      public.has_role('hcm')
      and p_category in ('photo', 'ktp', 'kk', 'contract', 'diploma', 'other')
      and exists (select 1 from public.employees e where e.id = p_entity_id)
    when 'employee_certificate' then
      public.has_role('hcm')
      and p_category = 'scan'
      and exists (select 1 from public.employee_certificates c where c.id = p_entity_id)
    when 'tender' then
      public.has_role('marketing')
      and p_category in ('rks', 'boq', 'offer_letter', 'other')
      and exists (select 1 from public.tenders t where t.id = p_entity_id)
    when 'project' then
      public.has_role('marketing', 'finance', 'operations')
      and p_category in ('contract', 'addendum', 'bap', 'bast', 'drawing', 'permit', 'correspondence', 'other')
      and exists (select 1 from public.projects p where p.id = p_entity_id)
    else false
  end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 10485760,
        array[
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ])
on conflict (id) do nothing;

create policy "Attachment readers read project files" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-files' and public.can_access_attachment_path(name, false));

create policy "Attachment writers upload project files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-files' and public.can_access_attachment_path(name, true));

create policy "Attachment writers delete project files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-files' and public.can_access_attachment_path(name, true));

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Proyek data kontrak & termin, RAB)
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;
revoke all on table public.projects from anon;
revoke insert, update, delete on table public.projects from authenticated;
-- Code, location and status are set by the system only.
grant insert (name, client_id, tender_id, end_owner, site, voltage_kv, length_kms, tower_count,
              start_date, target_finish_date, notes) on table public.projects to authenticated;
grant update (name, client_id, end_owner, site, voltage_kv, length_kms, tower_count,
              start_date, target_finish_date, notes) on table public.projects to authenticated;

create policy "Project readers" on public.projects
  for select to authenticated
  using ((select public.has_role('super_admin', 'director', 'marketing', 'finance', 'hcm', 'operations')));

create policy "Marketing and Finance add projects" on public.projects
  for insert to authenticated
  with check ((select public.has_role('marketing', 'finance')));

create policy "Marketing and Finance edit projects" on public.projects
  for update to authenticated
  using ((select public.has_role('marketing', 'finance')))
  with check ((select public.has_role('marketing', 'finance')));

do $$
declare
  t text;
begin
  foreach t in array array['project_contracts', 'project_addenda', 'project_terms']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format(
      'create policy "Contract readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''marketing'', ''finance'', ''operations'')))', t);
    execute format(
      'create policy "Marketing and Finance manage" on public.%I for all to authenticated '
      'using ((select public.has_role(''marketing'', ''finance''))) '
      'with check ((select public.has_role(''marketing'', ''finance'')))', t);
  end loop;
end;
$$;

-- Addenda are insert-only; term status moves through functions and invoices.
revoke update, delete on table public.project_addenda from authenticated;
revoke delete on table public.project_contracts from authenticated;
revoke insert, update on table public.project_terms from authenticated;
grant insert (project_id, sort_order, name, kind, percent, amount, condition_type, condition_progress,
              condition_date, notes) on table public.project_terms to authenticated;
grant update (sort_order, name, kind, percent, amount, condition_type, condition_progress,
              condition_date, notes) on table public.project_terms to authenticated;

alter table public.project_budgets enable row level security;
revoke all on table public.project_budgets from anon;

create policy "Budget readers" on public.project_budgets
  for select to authenticated
  using ((select public.has_role('super_admin', 'director', 'finance', 'operations')));

create policy "Finance and Operasional manage budgets" on public.project_budgets
  for all to authenticated
  using ((select public.has_role('finance', 'operations')))
  with check ((select public.has_role('finance', 'operations')));

revoke all on table public.project_overview from anon;
revoke all on table public.project_term_list from anon;
revoke all on table public.project_category_costs from anon;
revoke all on table public.project_budget_summary from anon;
