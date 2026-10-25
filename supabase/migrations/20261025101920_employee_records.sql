-- Employee records, pay settings, attachments and account links.
-- PRD HCM-01, HCM-02, UMM-03, MST-01 (change: add-employee-records).

-- ---------------------------------------------------------------------------
-- Employees (HCM-01)
-- ---------------------------------------------------------------------------
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_no text not null check (length(btrim(employee_no)) > 0),
  full_name text not null check (length(btrim(full_name)) > 0),
  nik_ktp text check (nik_ktp ~ '^\d{16}$'),
  birth_place text,
  birth_date date,
  address text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  blood_type text check (blood_type in ('A', 'B', 'AB', 'O')),
  employment_status text not null check (employment_status in ('permanent', 'contract', 'daily')),
  work_type text not null check (work_type in ('office', 'field')),
  position_id uuid not null references public.positions (id) on delete restrict,
  join_date date not null,
  exit_date date,
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  bpjs_number text,
  -- One source of truth: an exit date makes the employee inactive.
  is_active boolean generated always as (exit_date is null) stored,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (exit_date is null or exit_date >= join_date)
);

create unique index employees_employee_no_key on public.employees (lower(btrim(employee_no)));
create unique index employees_nik_ktp_key on public.employees (nik_ktp) where nik_ktp is not null;
create index employees_position_idx on public.employees (position_id);

create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create trigger employees_audit
after insert or update on public.employees
for each row execute function public.audit_row_change('id');

create or replace function public.employees_check_exit_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.exit_date is not null
     and (tg_op = 'INSERT' or new.exit_date is distinct from old.exit_date)
     and new.exit_date > public.today_wib() then
    raise exception 'Tanggal keluar tidak boleh melewati hari ini';
  end if;
  return new;
end;
$$;

create trigger employees_check_exit_date
before insert or update of exit_date on public.employees
for each row execute function public.employees_check_exit_date();

-- PRD §14: an employee who leaves loses their account at the same moment.
-- Runs through profiles_guard, so self-deactivation and removing the last
-- Super Admin are still refused. The app also bans the auth user.
create or replace function public.employees_deactivate_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set is_active = false
  where employee_id = new.id
    and is_active;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pay settings (HCM-02) — separate table, HCM/Finance/Direktur only
-- ---------------------------------------------------------------------------
create table public.employee_pay_settings (
  employee_id uuid primary key references public.employees (id) on delete cascade,
  pay_type text not null check (pay_type in ('daily', 'monthly')),
  daily_wage numeric(14, 2) check (daily_wage >= 0),
  base_salary numeric(14, 2) check (base_salary >= 0),
  fixed_allowance numeric(14, 2) not null default 0 check (fixed_allowance >= 0),
  meal_allowance_per_day numeric(14, 2) not null default 0 check (meal_allowance_per_day >= 0),
  field_allowance_per_day numeric(14, 2) not null default 0 check (field_allowance_per_day >= 0),
  overtime_rate_per_hour numeric(14, 2) not null default 0 check (overtime_rate_per_hour >= 0),
  fixed_deduction numeric(14, 2) not null default 0 check (fixed_deduction >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pay_type <> 'daily' or daily_wage is not null),
  check (pay_type <> 'monthly' or base_salary is not null)
);

create trigger employee_pay_settings_set_updated_at
before update on public.employee_pay_settings
for each row execute function public.set_updated_at();

create trigger employee_pay_settings_audit
after insert or update on public.employee_pay_settings
for each row execute function public.audit_row_change('employee_id');

-- Audit entries of pay tables are for Direktur only (PRD §6: Super Admin
-- does not see pay). Payroll tables join this list later.
create or replace function public.is_pay_table(p_table text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_table = any (array['employee_pay_settings'])
$$;

drop policy "Super Admin and Direktur read the audit log" on public.audit_log;

create policy "Audit log readers; pay entries for Direktur only"
on public.audit_log
for select
to authenticated
using (
  case
    when public.is_pay_table(table_name) then (select public.has_role('director'))
    else (select public.has_role('super_admin', 'director'))
  end
);

-- ---------------------------------------------------------------------------
-- Attachments (UMM-03)
-- Storage path: <entity_type>/<entity_id>/<category>/<file>. Access follows
-- the record: each entity type adds a case to the functions below.
-- ---------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type ~ '^[a-z_]+$'),
  entity_id uuid not null,
  category text not null check (category ~ '^[a-z_]+$'),
  bucket text not null,
  path text not null unique,
  file_name text not null check (length(btrim(file_name)) > 0),
  mime_type text not null,
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  uploaded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    split_part(path, '/', 1) = entity_type
    and split_part(path, '/', 2) = entity_id::text
    and split_part(path, '/', 3) = category
    and split_part(path, '/', 4) <> ''
    and split_part(path, '/', 5) = ''
  )
);

create index attachments_entity_idx on public.attachments (entity_type, entity_id, created_at desc);

create or replace function public.attachment_bucket(p_entity_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_entity_type
    when 'employee' then 'employee-files'
  end
$$;

-- Security invoker: the record check runs through the caller's own RLS.
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
    else false
  end
$$;

-- For storage policies: parse an object name; malformed names get no access.
create or replace function public.can_access_attachment_path(p_name text, p_write boolean)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  parts text[] := string_to_array(p_name, '/');
  entity uuid;
begin
  if coalesce(array_length(parts, 1), 0) <> 4 or parts[4] = '' then
    return false;
  end if;

  begin
    entity := parts[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  if p_write then
    return public.can_write_attachment(parts[1], entity, parts[3]);
  end if;
  return public.can_read_attachment(parts[1], entity, parts[3]);
end;
$$;

-- ---------------------------------------------------------------------------
-- Account ↔ employee link (MST-01)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column employee_id uuid unique references public.employees (id) on delete set null;

create or replace function public.profiles_employee_link_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.employee_id is not null
     and new.employee_id is distinct from old.employee_id
     and not exists (
       select 1 from public.employees e where e.id = new.employee_id and e.is_active
     ) then
    raise exception 'Karyawan nonaktif tidak dapat dihubungkan';
  end if;
  return new;
end;
$$;

create trigger profiles_employee_link_guard
before update of employee_id on public.profiles
for each row execute function public.profiles_employee_link_guard();

create trigger employees_deactivate_account
after update of exit_date on public.employees
for each row
when (old.exit_date is null and new.exit_date is not null)
execute function public.employees_deactivate_account();

grant update (employee_id) on table public.profiles to authenticated;

-- list_users gains the linked employee (return type changes: drop first).
drop function public.list_users();

create function public.list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.app_role,
  is_active boolean,
  status text,
  last_sign_in_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz,
  employee_id uuid,
  employee_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role('super_admin', 'director') then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.is_active,
    case
      when not p.is_active then 'inactive'
      when u.email_confirmed_at is null then 'invited'
      else 'active'
    end,
    u.last_sign_in_at,
    u.invited_at,
    p.created_at,
    p.employee_id,
    e.full_name
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.employees e on e.id = p.employee_id
  order by p.full_name;
end;
$$;

revoke execute on function public.list_users() from anon, public;
grant execute on function public.list_users() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13)
-- ---------------------------------------------------------------------------
alter table public.employees enable row level security;
alter table public.employee_pay_settings enable row level security;
alter table public.attachments enable row level security;

revoke all on table public.employees from anon;
revoke all on table public.employee_pay_settings from anon;
revoke all on table public.attachments from anon;

-- Never deleted: employees leave through an exit date.
revoke delete on table public.employees from authenticated;
revoke delete on table public.employee_pay_settings from authenticated;
revoke update on table public.attachments from authenticated;

create policy "Employee readers" on public.employees
  for select to authenticated
  using ((select public.has_role('super_admin', 'director', 'finance', 'hcm', 'operations')));

create policy "HCM adds employees" on public.employees
  for insert to authenticated
  with check ((select public.has_role('hcm')));

create policy "HCM updates employees" on public.employees
  for update to authenticated
  using ((select public.has_role('hcm')))
  with check ((select public.has_role('hcm')));

create policy "Pay readers" on public.employee_pay_settings
  for select to authenticated
  using ((select public.has_role('hcm', 'finance', 'director')));

create policy "HCM adds pay settings" on public.employee_pay_settings
  for insert to authenticated
  with check ((select public.has_role('hcm')));

create policy "HCM updates pay settings" on public.employee_pay_settings
  for update to authenticated
  using ((select public.has_role('hcm')))
  with check ((select public.has_role('hcm')));

create policy "Attachment readers" on public.attachments
  for select to authenticated
  using (public.can_read_attachment(entity_type, entity_id, category));

create policy "Attachment writers add files" on public.attachments
  for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and bucket = public.attachment_bucket(entity_type)
    and public.can_write_attachment(entity_type, entity_id, category)
  );

create policy "Attachment writers remove files" on public.attachments
  for delete to authenticated
  using (public.can_write_attachment(entity_type, entity_id, category));

-- ---------------------------------------------------------------------------
-- Storage: employee photo and documents (private, 10 MB)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('employee-files', 'employee-files', false, 10485760,
        array[
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ])
on conflict (id) do nothing;

create policy "Attachment readers read employee files" on storage.objects
  for select to authenticated
  using (bucket_id = 'employee-files' and public.can_access_attachment_path(name, false));

create policy "Attachment writers upload employee files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'employee-files' and public.can_access_attachment_path(name, true));

create policy "Attachment writers delete employee files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'employee-files' and public.can_access_attachment_path(name, true));
