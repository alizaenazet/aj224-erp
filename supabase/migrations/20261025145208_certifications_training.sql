-- Employee certificates, certificate status, reminders, trainings and
-- training needs. PRD HCM-03, HCM-04, HCM-07, HCM-08, §11.5
-- (change: add-certifications-training).

-- "25 Okt 2026" for notification texts (lc_time independent).
create or replace function public.format_date_id(p_date date)
returns text
language sql
immutable
set search_path = ''
as $$
  select extract(day from p_date)::int || ' '
    || (array['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'])[extract(month from p_date)::int]
    || ' ' || extract(year from p_date)::int
$$;

-- ---------------------------------------------------------------------------
-- Trainings (HCM-07) — created first: certificates reference them
-- ---------------------------------------------------------------------------
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  kind text not null check (kind in ('internal', 'external')),
  organizer text,
  start_date date not null,
  end_date date,
  location text,
  certificate_type_id uuid references public.certificate_types (id) on delete restrict,
  notes text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index trainings_start_idx on public.trainings (start_date desc);

create trigger trainings_set_updated_at
before update on public.trainings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Employee certificates (HCM-03)
-- ---------------------------------------------------------------------------
create table public.employee_certificates (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  certificate_type_id uuid not null references public.certificate_types (id) on delete restrict,
  certificate_no text,
  issuer text,
  issued_date date not null,
  -- Null = valid for life (Seumur hidup).
  expiry_date date,
  notes text,
  training_id uuid references public.trainings (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expiry_date is null or expiry_date >= issued_date)
);

create index employee_certificates_current_idx
  on public.employee_certificates (employee_id, certificate_type_id, expiry_date desc nulls first);

create trigger employee_certificates_set_updated_at
before update on public.employee_certificates
for each row execute function public.set_updated_at();

create trigger employee_certificates_audit
after insert or update on public.employee_certificates
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- Status (PRD §11.5): one definition for lists, fitness, needs and reminders
-- ---------------------------------------------------------------------------
create or replace function public.certificate_status(
  p_expiry date,
  p_on date default public.today_wib()
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_expiry is null then 'valid'
    when p_expiry < p_on then 'expired'
    when p_expiry <= p_on + (select sp.cert_expiry_warning_days from public.system_parameters sp) then 'expiring'
    else 'valid'
  end
$$;

-- The newest certificate per employee and type is current (lifetime first).
create view public.employee_certificate_list
with (security_invoker = true)
as
select
  c.id,
  c.employee_id,
  c.certificate_type_id,
  c.certificate_no,
  c.issuer,
  c.issued_date,
  c.expiry_date,
  c.notes,
  c.training_id,
  c.created_at,
  e.employee_no,
  e.full_name as employee_name,
  e.is_active as employee_active,
  e.work_type,
  e.position_id,
  t.name as certificate_type_name,
  public.certificate_status(c.expiry_date) as status,
  c.expiry_date - public.today_wib() as days_left,
  row_number() over (
    partition by c.employee_id, c.certificate_type_id
    order by c.expiry_date desc nulls first, c.issued_date desc, c.created_at desc
  ) = 1 as is_current
from public.employee_certificates c
join public.employees e on e.id = c.employee_id
join public.certificate_types t on t.id = c.certificate_type_id;

-- HCM-08: required certificates that are missing, expired or expiring.
create view public.training_needs
with (security_invoker = true)
as
select
  e.id as employee_id,
  e.employee_no,
  e.full_name as employee_name,
  e.position_id,
  p.name as position_name,
  r.certificate_type_id,
  t.name as certificate_type_name,
  cur.id as certificate_id,
  cur.expiry_date,
  case
    when cur.id is null then 'missing'
    else public.certificate_status(cur.expiry_date)
  end as status
from public.employees e
join public.positions p on p.id = e.position_id
join public.position_required_certificates r on r.position_id = e.position_id
join public.certificate_types t on t.id = r.certificate_type_id
left join lateral (
  select c.id, c.expiry_date
  from public.employee_certificates c
  where c.employee_id = e.id
    and c.certificate_type_id = r.certificate_type_id
  order by c.expiry_date desc nulls first, c.issued_date desc, c.created_at desc
  limit 1
) cur on true
where e.is_active
  -- Without certificate access every requirement would look "missing".
  and public.has_role('super_admin', 'director', 'hcm', 'operations')
  and (cur.id is null or public.certificate_status(cur.expiry_date) <> 'valid');

-- ---------------------------------------------------------------------------
-- Training participants; passed participants get a certificate (HCM-07)
-- ---------------------------------------------------------------------------
create table public.training_participants (
  training_id uuid not null references public.trainings (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete restrict,
  result text not null default 'pending' check (result in ('pending', 'passed', 'failed')),
  certificate_id uuid references public.employee_certificates (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (training_id, employee_id)
);

create index training_participants_employee_idx on public.training_participants (employee_id);

create trigger training_participants_set_updated_at
before update on public.training_participants
for each row execute function public.set_updated_at();

create or replace function public.training_participant_before()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  training record;
begin
  if tg_op = 'INSERT'
     and not exists (select 1 from public.employees e where e.id = new.employee_id and e.is_active) then
    raise exception 'Karyawan nonaktif tidak dapat menjadi peserta';
  end if;

  if new.result = 'passed' and new.certificate_id is null then
    select
      t.certificate_type_id,
      t.organizer,
      coalesce(t.end_date, t.start_date) as issued,
      ct.validity_months
    into training
    from public.trainings t
    left join public.certificate_types ct on ct.id = t.certificate_type_id
    where t.id = new.training_id;

    if training.certificate_type_id is not null then
      insert into public.employee_certificates
        (employee_id, certificate_type_id, issuer, issued_date, expiry_date, training_id)
      values (
        new.employee_id,
        training.certificate_type_id,
        training.organizer,
        training.issued,
        case
          when training.validity_months is null then null
          else (training.issued + make_interval(months => training.validity_months))::date
        end,
        new.training_id
      )
      returning id into new.certificate_id;
    end if;
  elsif tg_op = 'UPDATE' and new.result <> 'passed' and old.result = 'passed' then
    -- The AFTER trigger removes the generated certificate.
    new.certificate_id := null;
  end if;

  return new;
end;
$$;

create trigger training_participant_before
before insert or update of result on public.training_participants
for each row execute function public.training_participant_before();

create or replace function public.training_participant_after()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.employee_certificates
  where id = old.certificate_id
    and training_id = new.training_id;
  return null;
end;
$$;

create trigger training_participant_after
after update of result on public.training_participants
for each row
when (old.result = 'passed' and new.result <> 'passed' and old.certificate_id is not null)
execute function public.training_participant_after();

create or replace function public.trainings_guard_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.training_participants p
    where p.training_id = old.id and p.result = 'passed'
  ) then
    raise exception 'Pelatihan dengan peserta Lulus tidak dapat dihapus';
  end if;
  return old;
end;
$$;

create trigger trainings_guard_delete
before delete on public.trainings
for each row execute function public.trainings_guard_delete();

-- ---------------------------------------------------------------------------
-- Daily reminders (HCM-04). The Operasional reminder for assigned crew comes
-- with assignments (add-assignments-attendance).
-- ---------------------------------------------------------------------------
create or replace function public.check_certificate_expiry()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cert record;
begin
  for cert in
    select id, employee_name, certificate_type_name, expiry_date, status
    from public.employee_certificate_list
    where is_current
      and employee_active
      and status in ('expiring', 'expired')
  loop
    if cert.status = 'expiring' then
      perform public.notify_roles(
        array['hcm']::public.app_role[],
        'certificate',
        'Sertifikat segera kedaluwarsa',
        format('%s · %s berakhir %s.', cert.employee_name, cert.certificate_type_name,
               public.format_date_id(cert.expiry_date)),
        '/hr/certificates?status=expiring',
        'cert-expiring:' || cert.id
      );
    else
      perform public.notify_roles(
        array['hcm']::public.app_role[],
        'certificate',
        'Sertifikat kedaluwarsa',
        format('%s · %s berakhir %s.', cert.employee_name, cert.certificate_type_name,
               public.format_date_id(cert.expiry_date)),
        '/hr/certificates?status=expired',
        'cert-expired:' || cert.id
      );
    end if;
  end loop;
end;
$$;

revoke execute on function public.check_certificate_expiry() from public, anon, authenticated;

insert into public.scheduled_checks (name, function_name, description, sort_order)
values (
  'certificate-expiry',
  'public.check_certificate_expiry()',
  'Pengingat sertifikat segera kedaluwarsa dan kedaluwarsa ke HCM (HCM-04)',
  20
);

-- ---------------------------------------------------------------------------
-- Attachments: certificate scans (employee_certificate/<id>/scan/<file>)
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
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Sertifikat & pelatihan)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['trainings', 'employee_certificates', 'training_participants']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format(
      'create policy "Certificate and training readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''hcm'', ''operations'')))', t);
    execute format(
      'create policy "HCM manages" on public.%I for all to authenticated '
      'using ((select public.has_role(''hcm''))) with check ((select public.has_role(''hcm'')))', t);
  end loop;
end;
$$;

revoke all on table public.employee_certificate_list from anon;
revoke all on table public.training_needs from anon;
