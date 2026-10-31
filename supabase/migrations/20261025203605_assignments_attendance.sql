-- Project assignments with the certificate check and override, field and
-- office attendance, local workers from the field and Lapangan project
-- scoping. PRD HCM-05, HCM-06, HCM-09 … HCM-12, UMM-02, DSB-04
-- (change: add-assignments-attendance).

-- ---------------------------------------------------------------------------
-- Employees: local workers waiting for HCM verification (HCM-12)
-- ---------------------------------------------------------------------------
alter table public.employees
  add column verification_status text not null default 'verified'
    check (verification_status in ('verified', 'pending')),
  add column registered_by uuid references public.profiles (id) on delete set null;

insert into public.document_types (code, label, format, reset_period) values
  ('local_worker', 'Pekerja Lokal', 'LOK/AJ224/{YYYY}/{SEQ:3}', 'year');

-- ---------------------------------------------------------------------------
-- Assignments (HCM-05) with the certificate check (HCM-06, §11.5)
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  project_id uuid not null references public.projects (id) on delete restrict,
  position_id uuid not null references public.positions (id) on delete restrict,
  start_date date not null,
  end_date date,
  notes text,
  override_reason text,
  overridden_by uuid references public.profiles (id) on delete set null,
  overridden_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index assignments_employee_idx on public.assignments (employee_id, start_date);
create index assignments_project_idx on public.assignments (project_id, start_date);

create trigger assignments_set_updated_at
before update on public.assignments
for each row execute function public.set_updated_at();

create trigger assignments_audit
after insert or update on public.assignments
for each row execute function public.audit_row_change('id');

-- Required certificates of a position with the employee's current status on a
-- date: missing / expired / expiring / valid (§11.5).
create or replace function public.assignment_fitness(
  p_employee uuid,
  p_position uuid,
  p_on date default public.today_wib()
)
returns table (certificate_type_id uuid, certificate_type_name text, status text, expiry_date date)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.id,
    t.name,
    case when cur.id is null then 'missing' else public.certificate_status(cur.expiry_date, p_on) end,
    cur.expiry_date
  from public.position_required_certificates r
  join public.certificate_types t on t.id = r.certificate_type_id
  left join lateral (
    select c.id, c.expiry_date
    from public.employee_certificates c
    where c.employee_id = p_employee
      and c.certificate_type_id = r.certificate_type_id
      and c.issued_date <= p_on
    order by c.expiry_date desc nulls first, c.issued_date desc, c.created_at desc
    limit 1
  ) cur on true
  where r.position_id = p_position
  order by t.name;
$$;

create or replace function public.assignments_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee record;
  project record;
  other record;
  missing text;
begin
  -- Triggers run before RLS, so refuse other roles here without revealing
  -- anything about other assignments. Lapangan only inserts through
  -- register_local_worker, which sets the flag below.
  if auth.uid() is not null
     and not public.has_role('hcm')
     and not (public.has_role('field') and coalesce(current_setting('app.registering_worker', true), '') = 'on') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    -- Only the end date and notes change after creation (column grants).
    if new.end_date is distinct from old.end_date then
      select a.start_date, p.code into other
      from public.assignments a
      join public.projects p on p.id = a.project_id
      where a.employee_id = new.employee_id
        and a.id <> new.id
        and a.start_date <= coalesce(new.end_date, 'infinity'::date)
        and coalesce(a.end_date, 'infinity'::date) >= new.start_date
      limit 1;
      if found then
        raise exception 'Karyawan sudah ditugaskan di % mulai %', other.code, public.format_date_id(other.start_date);
      end if;
    end if;
    return new;
  end if;

  -- Lock the employee so two assignments cannot pass the overlap check together.
  select full_name, join_date, exit_date into employee
  from public.employees
  where id = new.employee_id
  for update;
  if not found then
    raise exception 'Karyawan tidak ditemukan';
  end if;
  if new.start_date < employee.join_date then
    raise exception 'Tanggal mulai sebelum tanggal masuk karyawan (%)', public.format_date_id(employee.join_date);
  end if;
  if employee.exit_date is not null and employee.exit_date < new.start_date then
    raise exception '% sudah keluar pada %', employee.full_name, public.format_date_id(employee.exit_date);
  end if;

  select code, status into project from public.projects where id = new.project_id;
  if not found then
    raise exception 'Proyek tidak ditemukan';
  end if;
  if project.status in ('completed', 'closed') then
    raise exception 'Proyek % sudah selesai atau ditutup', project.code;
  end if;

  select a.start_date, p.code into other
  from public.assignments a
  join public.projects p on p.id = a.project_id
  where a.employee_id = new.employee_id
    and a.start_date <= coalesce(new.end_date, 'infinity'::date)
    and coalesce(a.end_date, 'infinity'::date) >= new.start_date
  limit 1;
  if found then
    raise exception '% masih ditugaskan di % sejak %; akhiri penugasan itu dulu',
      employee.full_name, other.code, public.format_date_id(other.start_date);
  end if;

  select string_agg(
           f.certificate_type_name || case f.status when 'missing' then ' belum ada' else ' kedaluwarsa' end,
           ', ' order by f.certificate_type_name)
  into missing
  from public.assignment_fitness(new.employee_id, new.position_id, new.start_date) f
  where f.status in ('missing', 'expired');

  if missing is null then
    new.override_reason := null;
    new.overridden_by := null;
    new.overridden_at := null;
  elsif nullif(btrim(coalesce(new.override_reason, '')), '') is null then
    raise exception 'Sertifikat wajib tidak lengkap: %. Isi alasan override bila tetap ditugaskan.', missing;
  else
    new.override_reason := btrim(new.override_reason);
    new.overridden_by := auth.uid();
    new.overridden_at := now();
  end if;
  return new;
end;
$$;

create trigger assignments_check
before insert or update on public.assignments
for each row execute function public.assignments_check();

-- HCM-06: an override is an audit entry of its own, with the missing certificates.
create or replace function public.assignments_audit_override()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (table_name, record_id, action, actor_id, new_values, reason)
  values (
    'assignments',
    new.id::text,
    'override',
    auth.uid(),
    jsonb_build_object(
      'employee_id', new.employee_id,
      'project_id', new.project_id,
      'position_id', new.position_id,
      'missing_certificates', (
        select string_agg(
                 f.certificate_type_name || case f.status when 'missing' then ' (belum ada)' else ' (kedaluwarsa)' end,
                 ', ' order by f.certificate_type_name)
        from public.assignment_fitness(new.employee_id, new.position_id, new.start_date) f
        where f.status in ('missing', 'expired')
      )
    ),
    new.override_reason
  );
  return null;
end;
$$;

create trigger assignments_audit_override
after insert on public.assignments
for each row when (new.overridden_at is not null)
execute function public.assignments_audit_override();

-- An employee who leaves stops working on their projects that day.
create or replace function public.employees_end_assignments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.exit_date is not null and new.exit_date is distinct from old.exit_date then
    update public.assignments
    set end_date = greatest(start_date, new.exit_date)
    where employee_id = new.id
      and (end_date is null or end_date > new.exit_date);
  end if;
  return null;
end;
$$;

create trigger employees_end_assignments
after update of exit_date on public.employees
for each row execute function public.employees_end_assignments();

-- Assignment list with state and today's certificate state (HCM-05, HCM-06).
create view public.assignment_list
with (security_invoker = true)
as
select
  a.id,
  a.employee_id,
  a.project_id,
  a.position_id,
  a.start_date,
  a.end_date,
  a.notes,
  a.override_reason,
  a.overridden_by,
  a.overridden_at,
  a.created_at,
  e.employee_no,
  e.full_name as employee_name,
  e.work_type,
  e.verification_status,
  e.is_active as employee_active,
  p.code as project_code,
  p.name as project_name,
  p.status as project_status,
  pos.name as position_name,
  case
    when a.start_date > public.today_wib() then 'upcoming'
    when a.end_date is not null and a.end_date < public.today_wib() then 'ended'
    else 'active'
  end as state,
  fit.cert_state,
  fit.cert_issues
from public.assignments a
join public.employees e on e.id = a.employee_id
join public.projects p on p.id = a.project_id
join public.positions pos on pos.id = a.position_id
left join lateral (
  select
    case
      when bool_or(f.status = 'missing') then 'missing'
      when bool_or(f.status = 'expired') then 'expired'
      when bool_or(f.status = 'expiring') then 'expiring'
      when count(*) > 0 then 'valid'
    end as cert_state,
    string_agg(
      case f.status
        when 'missing' then f.certificate_type_name || ' belum ada'
        when 'expired' then f.certificate_type_name || ' kedaluwarsa'
        when 'expiring' then f.certificate_type_name || ' segera kedaluwarsa'
      end,
      ', ' order by f.certificate_type_name
    ) as cert_issues
  from public.assignment_fitness(a.employee_id, a.position_id, public.today_wib()) f
) fit on true;

-- ---------------------------------------------------------------------------
-- Lapangan scoping (UMM-02, PRD §6): active assignment of the linked employee
-- ---------------------------------------------------------------------------
create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select employee_id from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.user_project_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct a.project_id
  from public.profiles pr
  join public.assignments a on a.employee_id = pr.employee_id
  where pr.id = auth.uid()
    and pr.is_active
    and a.start_date <= public.today_wib()
    and (a.end_date is null or a.end_date >= public.today_wib())
$$;

-- Everyone assigned (at any time) to the user's active projects.
create or replace function public.user_crew_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct a.employee_id
  from public.assignments a
  where a.project_id in (select public.user_project_ids())
$$;

-- ---------------------------------------------------------------------------
-- Attendance (HCM-09, HCM-10)
-- ---------------------------------------------------------------------------
create table public.attendance_days (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  work_date date not null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, work_date)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  work_date date not null,
  status text not null check (status in ('present', 'permit', 'sick', 'leave', 'absent', 'off')),
  overtime_hours numeric(4, 1) not null default 0 check (overtime_hours between 0 and 24),
  -- Null = office (kantor).
  project_id uuid references public.projects (id) on delete restrict,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date),
  check (status = 'present' or overtime_hours = 0)
);

create index attendance_project_idx on public.attendance (project_id, work_date);
create index attendance_date_idx on public.attendance (work_date);

create trigger attendance_set_updated_at
before update on public.attendance
for each row execute function public.set_updated_at();

create or replace function public.attendance_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee record;
begin
  -- Triggers run before RLS: refuse other roles and other projects up front.
  if auth.uid() is not null then
    if public.has_role('field') then
      if new.project_id is null or new.project_id not in (select public.user_project_ids()) then
        raise exception 'Anda tidak ditugaskan di proyek ini' using errcode = '42501';
      end if;
      if new.employee_id not in (select public.user_crew_ids()) then
        raise exception 'Karyawan ini bukan kru proyek Anda' using errcode = '42501';
      end if;
    elsif not public.has_role('hcm') then
      raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
    end if;
  end if;

  if new.work_date > public.today_wib() then
    raise exception 'Absensi tidak dapat diisi untuk tanggal mendatang';
  end if;
  if public.has_role('field') and new.work_date < public.today_wib() - 3 then
    raise exception 'Input absensi lapangan paling lambat H+3; hubungi HCM untuk tanggal %',
      public.format_date_id(new.work_date);
  end if;

  select full_name, join_date, exit_date into employee from public.employees where id = new.employee_id;
  if not found then
    raise exception 'Karyawan tidak ditemukan';
  end if;
  if new.work_date < employee.join_date or (employee.exit_date is not null and new.work_date > employee.exit_date) then
    raise exception '% tidak aktif pada %', employee.full_name, public.format_date_id(new.work_date);
  end if;

  if new.project_id is not null and not exists (
    select 1
    from public.assignments a
    where a.employee_id = new.employee_id
      and a.project_id = new.project_id
      and a.start_date <= new.work_date
      and (a.end_date is null or a.end_date >= new.work_date)
  ) then
    raise exception '% tidak ditugaskan di proyek ini pada %', employee.full_name, public.format_date_id(new.work_date);
  end if;

  new.recorded_by := auth.uid();
  return new;
end;
$$;

create trigger attendance_check
before insert or update on public.attendance
for each row execute function public.attendance_check();

-- Saves one day's sheet: the project day (for the photo) and each row.
-- p_rows = [{ employee_id, status, overtime_hours, notes }]. RLS applies.
create or replace function public.save_attendance(p_project uuid, p_date date, p_rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item jsonb;
  saved integer := 0;
begin
  if p_project is not null then
    insert into public.attendance_days (project_id, work_date)
    values (p_project, p_date)
    on conflict (project_id, work_date) do nothing;
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  loop
    insert into public.attendance (employee_id, work_date, status, overtime_hours, project_id, notes)
    values (
      (item ->> 'employee_id')::uuid,
      p_date,
      item ->> 'status',
      coalesce((item ->> 'overtime_hours')::numeric, 0),
      p_project,
      nullif(btrim(item ->> 'notes'), '')
    )
    on conflict (employee_id, work_date) do update
      set status = excluded.status,
          overtime_hours = excluded.overtime_hours,
          project_id = excluded.project_id,
          notes = excluded.notes;
    saved := saved + 1;
  end loop;
  return saved;
end;
$$;

revoke execute on function public.save_attendance(uuid, date, jsonb) from public, anon;
grant execute on function public.save_attendance(uuid, date, jsonb) to authenticated;

-- HCM-11 recap: days per status and overtime per employee and project (null = kantor).
create or replace function public.attendance_recap(p_from date, p_to date)
returns table (
  employee_id uuid,
  project_id uuid,
  present integer,
  permit integer,
  sick integer,
  leave integer,
  absent integer,
  off integer,
  overtime_hours numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    a.employee_id,
    a.project_id,
    (count(*) filter (where a.status = 'present'))::int,
    (count(*) filter (where a.status = 'permit'))::int,
    (count(*) filter (where a.status = 'sick'))::int,
    (count(*) filter (where a.status = 'leave'))::int,
    (count(*) filter (where a.status = 'absent'))::int,
    (count(*) filter (where a.status = 'off'))::int,
    coalesce(sum(a.overtime_hours), 0)
  from public.attendance a
  where a.work_date between p_from and p_to
  group by a.employee_id, a.project_id;
$$;

-- ---------------------------------------------------------------------------
-- Local workers registered from the field (HCM-12)
-- ---------------------------------------------------------------------------
create or replace function public.register_local_worker(p_project uuid, p_worker jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  worker_name text := btrim(p_worker ->> 'full_name');
  worker_nik text := btrim(p_worker ->> 'nik_ktp');
  worker_phone text := nullif(btrim(p_worker ->> 'phone'), '');
  wage numeric := (p_worker ->> 'daily_wage')::numeric;
  worker_position record;
  project_code text;
  new_id uuid;
begin
  if not public.has_role('field') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if p_project is null or p_project not in (select public.user_project_ids()) then
    raise exception 'Anda tidak ditugaskan di proyek ini' using errcode = '42501';
  end if;
  if worker_name is null or worker_name = '' then
    raise exception 'Nama pekerja wajib diisi';
  end if;
  if worker_nik is null or worker_nik !~ '^\d{16}$' then
    raise exception 'NIK KTP harus 16 angka';
  end if;
  if exists (select 1 from public.employees where nik_ktp = worker_nik) then
    raise exception 'NIK KTP sudah terdaftar; hubungi HCM';
  end if;
  if wage is null or wage <= 0 then
    raise exception 'Upah harian wajib diisi';
  end if;

  select id, name, is_active into worker_position
  from public.positions
  where id = (p_worker ->> 'position_id')::uuid;
  if not found or not worker_position.is_active then
    raise exception 'Jabatan tidak valid';
  end if;
  if exists (select 1 from public.position_required_certificates where position_id = worker_position.id) then
    raise exception 'Jabatan % memerlukan sertifikat; pekerja ini harus didaftarkan oleh HCM', worker_position.name;
  end if;

  insert into public.employees (
    employee_no, full_name, nik_ktp, phone, employment_status, work_type, position_id,
    join_date, verification_status, registered_by, created_by
  ) values (
    public.next_document_number('local_worker', public.today_wib()), worker_name, worker_nik, worker_phone,
    'daily', 'field', worker_position.id, public.today_wib(), 'pending', auth.uid(), auth.uid()
  )
  returning id into new_id;

  insert into public.employee_pay_settings (employee_id, pay_type, daily_wage)
  values (new_id, 'daily', wage);

  perform set_config('app.registering_worker', 'on', true);
  insert into public.assignments (employee_id, project_id, position_id, start_date, created_by)
  values (new_id, p_project, worker_position.id, public.today_wib(), auth.uid());
  perform set_config('app.registering_worker', 'off', true);

  select code into project_code from public.projects where id = p_project;
  perform public.notify_roles(
    array['hcm']::public.app_role[],
    'employee',
    'Pekerja baru menunggu verifikasi',
    format('%s · %s · %s', worker_name, worker_position.name, project_code),
    '/hr/employees/' || new_id,
    'worker-pending:' || new_id
  );
  return new_id;
end;
$$;

revoke execute on function public.register_local_worker(uuid, jsonb) from public, anon;
grant execute on function public.register_local_worker(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Attachments: paper attendance sheet per project day (HCM-09)
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
    when 'attendance_day' then 'project-files'
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
    when 'attendance_day' then
      exists (select 1 from public.attendance_days d where d.id = p_entity_id)
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
    when 'attendance_day' then
      public.has_role('hcm', 'field')
      and p_category = 'sheet'
      and exists (select 1 from public.attendance_days d where d.id = p_entity_id)
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Penugasan, Absensi; Lapangan (P))
-- ---------------------------------------------------------------------------
alter table public.assignments enable row level security;
revoke all on table public.assignments from anon;
revoke insert, update, delete on table public.assignments from authenticated;
grant insert (employee_id, project_id, position_id, start_date, end_date, notes, override_reason)
  on table public.assignments to authenticated;
grant update (end_date, notes) on table public.assignments to authenticated;

create policy "Assignment readers" on public.assignments
  for select to authenticated
  using ((select public.has_role('super_admin', 'director', 'hcm', 'operations')));

create policy "Lapangan reads assignments of their projects" on public.assignments
  for select to authenticated
  using ((select public.has_role('field')) and project_id in (select public.user_project_ids()));

create policy "HCM adds assignments" on public.assignments
  for insert to authenticated
  with check ((select public.has_role('hcm')));

create policy "HCM ends assignments" on public.assignments
  for update to authenticated
  using ((select public.has_role('hcm')))
  with check ((select public.has_role('hcm')));

alter table public.attendance_days enable row level security;
alter table public.attendance enable row level security;
revoke all on table public.attendance_days from anon;
revoke all on table public.attendance from anon;
revoke update, delete on table public.attendance_days from authenticated;
revoke insert, update, delete on table public.attendance from authenticated;
grant insert (employee_id, work_date, status, overtime_hours, project_id, notes) on table public.attendance to authenticated;
grant update (status, overtime_hours, project_id, notes) on table public.attendance to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['attendance_days', 'attendance']
  loop
    execute format(
      'create policy "Attendance readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''finance'', ''hcm'', ''operations'')))', t);
    execute format(
      'create policy "Lapangan reads attendance of their projects" on public.%I for select to authenticated '
      'using ((select public.has_role(''field'')) and project_id in (select public.user_project_ids()))', t);
    execute format(
      'create policy "HCM records attendance" on public.%I for insert to authenticated '
      'with check ((select public.has_role(''hcm'')))', t);
    execute format(
      'create policy "Lapangan records attendance of their projects" on public.%I for insert to authenticated '
      'with check ((select public.has_role(''field'')) and project_id in (select public.user_project_ids()))', t);
  end loop;
end;
$$;

create policy "HCM corrects attendance" on public.attendance
  for update to authenticated
  using ((select public.has_role('hcm')))
  with check ((select public.has_role('hcm')));

create policy "Lapangan corrects attendance of their projects" on public.attendance
  for update to authenticated
  using ((select public.has_role('field')) and project_id in (select public.user_project_ids()))
  with check ((select public.has_role('field')) and project_id in (select public.user_project_ids()));

-- Lapangan sees their projects, the sections and progress of those projects,
-- their crew and the crew's certificates (PRD §13 (P)).
create policy "Lapangan reads assigned projects" on public.projects
  for select to authenticated
  using ((select public.has_role('field')) and id in (select public.user_project_ids()));

do $$
declare
  t text;
begin
  foreach t in array array['project_stages', 'project_sections', 'progress_updates']
  loop
    execute format(
      'create policy "Lapangan reads their projects" on public.%I for select to authenticated '
      'using ((select public.has_role(''field'')) and project_id in (select public.user_project_ids()))', t);
  end loop;
end;
$$;

create policy "Lapangan reads their projects" on public.section_progress
  for select to authenticated
  using (
    (select public.has_role('field'))
    and section_id in (
      select s.id from public.project_sections s where s.project_id in (select public.user_project_ids())
    )
  );

create policy "Lapangan reads their crew" on public.employees
  for select to authenticated
  using (
    (select public.has_role('field'))
    and (id in (select public.user_crew_ids()) or id = (select public.current_employee_id()))
  );

create policy "Lapangan reads their crew's certificates" on public.employee_certificates
  for select to authenticated
  using ((select public.has_role('field')) and employee_id in (select public.user_crew_ids()));

revoke all on table public.assignment_list from anon;

revoke execute on function public.current_employee_id() from public, anon;
revoke execute on function public.user_project_ids() from public, anon;
revoke execute on function public.user_crew_ids() from public, anon;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.user_project_ids() to authenticated;
grant execute on function public.user_crew_ids() to authenticated;
