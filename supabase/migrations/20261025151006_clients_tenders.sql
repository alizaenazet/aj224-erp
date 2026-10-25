-- Clients, contacts, activity log, tenders, bid revisions, reminders and
-- tender analytics. PRD MKT-01 … MKT-08, §11.1 (change: add-clients-tenders).

-- ---------------------------------------------------------------------------
-- Names of active staff (PIC pickers, authors). Profiles RLS stays strict.
-- ---------------------------------------------------------------------------
create or replace function public.list_people(p_roles public.app_role[] default null)
returns table (id uuid, full_name text, role public.app_role)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.role
  from public.profiles p
  where public.is_active_user()
    and p.is_active
    and (p_roles is null or p.role = any (p_roles))
  order by p.full_name
$$;

revoke execute on function public.list_people(public.app_role[]) from public, anon;
grant execute on function public.list_people(public.app_role[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Clients and contacts (MKT-01)
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  kind text not null check (kind in ('epc', 'bumn', 'pln', 'private')),
  address text,
  npwp text,
  payment_term_days integer not null default 30 check (payment_term_days between 0 and 365),
  notes text,
  is_active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index clients_name_key on public.clients (lower(btrim(name)));

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger clients_audit
after insert or update on public.clients
for each row execute function public.audit_row_change('id');

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  position text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_contacts_client_idx on public.client_contacts (client_id);

create trigger client_contacts_set_updated_at
before update on public.client_contacts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tenders (MKT-03, MKT-04, MKT-07); §11.1 margin and weighted value
-- ---------------------------------------------------------------------------
create table public.tenders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  client_id uuid not null references public.clients (id) on delete restrict,
  end_owner text,
  location text,
  voltage_kv integer check (voltage_kv in (150, 275, 500)),
  length_kms numeric(10, 2) check (length_kms >= 0),
  tower_count integer check (tower_count >= 0),
  scope text,
  info_date date,
  bid_deadline date,
  bid_value numeric(16, 2) check (bid_value >= 0),
  estimated_cost numeric(16, 2) check (estimated_cost >= 0),
  pic_id uuid references public.profiles (id) on delete set null,
  win_probability integer check (win_probability between 0 and 100),
  status text not null default 'prospect'
    check (status in ('prospect', 'preparing', 'submitted', 'negotiation', 'won', 'lost', 'cancelled')),
  closed_date date,
  lost_reason text check (lost_reason in ('price', 'technical', 'schedule', 'relationship', 'administrative', 'other')),
  lost_note text,
  winner_name text,
  winner_price numeric(16, 2) check (winner_price >= 0),
  notes text,
  -- Carries the note of a bid revision into the trigger; always null at rest.
  bid_revision_note text,
  planned_margin numeric(7, 2) generated always as (
    case
      when bid_value > 0 and estimated_cost is not null
        then round((bid_value - estimated_cost) / bid_value * 100, 2)
    end
  ) stored,
  weighted_value numeric(16, 2) generated always as (
    case
      when bid_value is not null and win_probability is not null
        then round(bid_value * win_probability / 100, 2)
    end
  ) stored,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status in ('won', 'lost', 'cancelled')) = (closed_date is not null)),
  check (status <> 'lost' or lost_reason is not null),
  check (status = 'lost' or (lost_reason is null and lost_note is null and winner_name is null and winner_price is null))
);

create index tenders_client_idx on public.tenders (client_id);
create index tenders_status_idx on public.tenders (status, bid_deadline);
create index tenders_closed_idx on public.tenders (closed_date) where closed_date is not null;

create trigger tenders_set_updated_at
before update on public.tenders
for each row execute function public.set_updated_at();

create table public.tender_bid_revisions (
  id uuid primary key default gen_random_uuid(),
  -- Deferred: the first revision is written while the tender row is inserted.
  tender_id uuid not null references public.tenders (id) on delete cascade deferrable initially deferred,
  -- clock_timestamp: several revisions in one transaction keep their order.
  revised_at timestamptz not null default clock_timestamp(),
  old_value numeric(16, 2),
  new_value numeric(16, 2),
  note text,
  revised_by uuid references public.profiles (id) on delete set null
);

create index tender_bid_revisions_tender_idx on public.tender_bid_revisions (tender_id, revised_at desc);

-- MKT-05: every bid value change is stored, with the note given for it.
create or replace function public.tenders_bid_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' and new.bid_value is not null)
     or (tg_op = 'UPDATE' and new.bid_value is distinct from old.bid_value) then
    insert into public.tender_bid_revisions (tender_id, old_value, new_value, note, revised_by)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.bid_value end,
      new.bid_value,
      nullif(btrim(new.bid_revision_note), ''),
      auth.uid()
    );
  end if;
  new.bid_revision_note := null;
  return new;
end;
$$;

create trigger tenders_bid_revision
before insert or update on public.tenders
for each row execute function public.tenders_bid_revision();

-- MKT-04: closing data belongs to Menang/Kalah/Batal only.
create or replace function public.tenders_status_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('won', 'lost', 'cancelled') then
    new.closed_date := coalesce(new.closed_date, public.today_wib());
    if new.closed_date > public.today_wib() then
      raise exception 'Tanggal penutupan tidak boleh melewati hari ini';
    end if;
    if new.status = 'lost' and new.lost_reason is null then
      raise exception 'Alasan kalah wajib diisi';
    end if;
  else
    new.closed_date := null;
  end if;

  if new.status <> 'lost' then
    new.lost_reason := null;
    new.lost_note := null;
    new.winner_name := null;
    new.winner_price := null;
  end if;
  return new;
end;
$$;

create trigger tenders_status_guard
before insert or update of status, closed_date, lost_reason on public.tenders
for each row execute function public.tenders_status_guard();

create trigger tenders_audit
after insert or update on public.tenders
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- Activity log and follow-ups (MKT-02)
-- ---------------------------------------------------------------------------
create table public.client_activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  tender_id uuid references public.tenders (id) on delete set null,
  activity_date date not null,
  kind text not null check (kind in ('visit', 'call', 'meeting', 'other')),
  notes text not null check (length(btrim(notes)) > 0),
  follow_up_date date,
  follow_up_done_at timestamptz,
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (follow_up_done_at is null or follow_up_date is not null)
);

create index client_activities_client_idx on public.client_activities (client_id, activity_date desc);
create index client_activities_follow_up_idx on public.client_activities (follow_up_date)
  where follow_up_date is not null and follow_up_done_at is null;

create trigger client_activities_set_updated_at
before update on public.client_activities
for each row execute function public.set_updated_at();

create or replace function public.client_activities_tender_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tender_id is not null and not exists (
    select 1 from public.tenders t where t.id = new.tender_id and t.client_id = new.client_id
  ) then
    raise exception 'Tender bukan milik klien ini';
  end if;
  return new;
end;
$$;

create trigger client_activities_tender_guard
before insert or update of tender_id, client_id on public.client_activities
for each row execute function public.client_activities_tender_guard();

-- ---------------------------------------------------------------------------
-- §11.1 numbers: one definition, used by every page (security invoker)
-- ---------------------------------------------------------------------------
create view public.client_tender_stats
with (security_invoker = true)
as
select
  c.id as client_id,
  count(t.id)::int as tender_count,
  (count(t.id) filter (where t.status = 'won'))::int as won_count,
  (count(t.id) filter (where t.status = 'lost'))::int as lost_count,
  coalesce(sum(t.bid_value) filter (where t.status = 'won'), 0) as won_value,
  coalesce(sum(t.bid_value) filter (where t.status = 'lost'), 0) as lost_value,
  round(
    100.0 * count(t.id) filter (where t.status = 'won')
    / nullif(count(t.id) filter (where t.status in ('won', 'lost')), 0), 1
  ) as win_rate_count,
  round(
    100.0 * coalesce(sum(t.bid_value) filter (where t.status = 'won'), 0)
    / nullif(sum(t.bid_value) filter (where t.status in ('won', 'lost')), 0), 1
  ) as win_rate_value
from public.clients c
left join public.tenders t on t.client_id = c.id
group by c.id;

-- Win rates for tenders closed in [p_from, p_to], overall / per client / per voltage.
create or replace function public.tender_win_stats(p_from date, p_to date)
returns table (
  dimension text,
  key text,
  label text,
  won_count integer,
  lost_count integer,
  won_value numeric,
  lost_value numeric,
  win_rate_count numeric,
  win_rate_value numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with closed as (
    select t.status, t.bid_value, t.client_id, c.name as client_name, t.voltage_kv
    from public.tenders t
    join public.clients c on c.id = t.client_id
    where t.status in ('won', 'lost')
      and t.closed_date between p_from and p_to
  ),
  rows as (
    select 'all' as dimension, 'all' as key, 'Semua tender' as label, status, bid_value from closed
    union all
    select 'client', client_id::text, client_name, status, bid_value from closed
    union all
    select 'voltage', coalesce(voltage_kv::text, 'none'),
           coalesce(voltage_kv::text || ' kV', 'Tanpa tegangan'), status, bid_value
    from closed
  )
  select
    dimension,
    key,
    label,
    (count(*) filter (where status = 'won'))::int,
    (count(*) filter (where status = 'lost'))::int,
    coalesce(sum(bid_value) filter (where status = 'won'), 0),
    coalesce(sum(bid_value) filter (where status = 'lost'), 0),
    round(100.0 * count(*) filter (where status = 'won') / nullif(count(*), 0), 1),
    round(100.0 * coalesce(sum(bid_value) filter (where status = 'won'), 0) / nullif(sum(bid_value), 0), 1)
  from rows
  group by dimension, key, label
  order by dimension, label
$$;

create or replace function public.tender_lost_reasons(p_from date, p_to date)
returns table (reason text, tender_count integer, bid_value numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.lost_reason, count(*)::int, coalesce(sum(t.bid_value), 0)
  from public.tenders t
  where t.status = 'lost'
    and t.closed_date between p_from and p_to
  group by t.lost_reason
  order by count(*) desc, t.lost_reason
$$;

create or replace function public.tender_pipeline()
returns table (status text, tender_count integer, bid_value numeric, weighted_value numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.status, count(*)::int, coalesce(sum(t.bid_value), 0), coalesce(sum(t.weighted_value), 0)
  from public.tenders t
  where t.status in ('prospect', 'preparing', 'submitted', 'negotiation')
  group by t.status
$$;

-- ---------------------------------------------------------------------------
-- Daily reminders (MKT-06, MKT-02)
-- ---------------------------------------------------------------------------
create or replace function public.check_tender_deadlines()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  tender record;
begin
  for tender in
    select t.id, t.name, c.name as client_name, t.bid_deadline,
           t.bid_deadline - public.today_wib() as days_left
    from public.tenders t
    join public.clients c on c.id = t.client_id
    where t.status in ('prospect', 'preparing')
      and t.bid_deadline - public.today_wib() in (1, 3)
  loop
    perform public.notify_roles(
      array['marketing']::public.app_role[],
      'tender',
      format('Batas penawaran %s hari lagi', tender.days_left),
      format('%s · %s · batas %s.', tender.name, tender.client_name, public.format_date_id(tender.bid_deadline)),
      '/marketing/tenders/' || tender.id,
      format('tender-deadline-%s:%s:%s', tender.days_left, tender.id, tender.bid_deadline)
    );
  end loop;
end;
$$;

create or replace function public.check_client_followups()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity record;
begin
  for activity in
    select a.id, a.owner_id, a.follow_up_date, a.notes, c.name as client_name
    from public.client_activities a
    join public.clients c on c.id = a.client_id
    where a.follow_up_date is not null
      and a.follow_up_done_at is null
      and a.follow_up_date <= public.today_wib()
      and a.owner_id is not null
  loop
    perform public.notify_user(
      activity.owner_id,
      'follow_up',
      'Tindak lanjut jatuh tempo',
      format('%s · %s: %s', activity.client_name, public.format_date_id(activity.follow_up_date),
             left(activity.notes, 80)),
      '/marketing/follow-ups',
      format('follow-up:%s:%s', activity.id, activity.follow_up_date)
    );
  end loop;
end;
$$;

revoke execute on function public.check_tender_deadlines() from public, anon, authenticated;
revoke execute on function public.check_client_followups() from public, anon, authenticated;

insert into public.scheduled_checks (name, function_name, description, sort_order) values
  ('tender-deadlines', 'public.check_tender_deadlines()',
   'Pengingat H-3 dan H-1 batas penawaran tender Prospek/Persiapan (MKT-06)', 30),
  ('client-followups', 'public.check_client_followups()',
   'Pengingat tindak lanjut klien yang jatuh tempo (MKT-02)', 31);

-- ---------------------------------------------------------------------------
-- Attachments: tender documents (tender/<id>/<category>/<file>)
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
    else false
  end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketing-files', 'marketing-files', false, 10485760,
        array[
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ])
on conflict (id) do nothing;

create policy "Attachment readers read marketing files" on storage.objects
  for select to authenticated
  using (bucket_id = 'marketing-files' and public.can_access_attachment_path(name, false));

create policy "Attachment writers upload marketing files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'marketing-files' and public.can_access_attachment_path(name, true));

create policy "Attachment writers delete marketing files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'marketing-files' and public.can_access_attachment_path(name, true));

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Klien & kontak, Tender & analitik)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['clients', 'client_contacts', 'tenders', 'tender_bid_revisions', 'client_activities']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format(
      'create policy "Marketing data readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''marketing'', ''finance'', ''operations'')))', t);
  end loop;
end;
$$;

create policy "Marketing and Super Admin manage clients" on public.clients
  for all to authenticated
  using ((select public.has_role('super_admin', 'marketing')))
  with check ((select public.has_role('super_admin', 'marketing')));

create policy "Marketing and Super Admin manage contacts" on public.client_contacts
  for all to authenticated
  using ((select public.has_role('super_admin', 'marketing')))
  with check ((select public.has_role('super_admin', 'marketing')));

-- Tenders: Marketing only (Super Admin views); never deleted (Batal instead).
revoke delete on table public.tenders from authenticated;

create policy "Marketing adds tenders" on public.tenders
  for insert to authenticated
  with check ((select public.has_role('marketing')));

create policy "Marketing updates tenders" on public.tenders
  for update to authenticated
  using ((select public.has_role('marketing')))
  with check ((select public.has_role('marketing')));

-- Revisions are written by the tender trigger only.
revoke insert, update, delete on table public.tender_bid_revisions from authenticated;

-- Activities: authors edit their own; Super Admin edits all.
create policy "Marketing logs activities" on public.client_activities
  for insert to authenticated
  with check ((select public.has_role('super_admin', 'marketing')) and owner_id = (select auth.uid()));

create policy "Authors update activities" on public.client_activities
  for update to authenticated
  using (
    (select public.has_role('super_admin'))
    or (owner_id = (select auth.uid()) and (select public.has_role('marketing')))
  )
  with check (
    (select public.has_role('super_admin'))
    or (owner_id = (select auth.uid()) and (select public.has_role('marketing')))
  );

create policy "Authors delete activities" on public.client_activities
  for delete to authenticated
  using (
    (select public.has_role('super_admin'))
    or (owner_id = (select auth.uid()) and (select public.has_role('marketing')))
  );

revoke all on table public.client_tender_stats from anon;
revoke execute on function public.tender_win_stats(date, date) from public, anon;
revoke execute on function public.tender_lost_reasons(date, date) from public, anon;
revoke execute on function public.tender_pipeline() from public, anon;
grant execute on function public.tender_win_stats(date, date) to authenticated;
grant execute on function public.tender_lost_reasons(date, date) to authenticated;
grant execute on function public.tender_pipeline() to authenticated;
