-- K3 incidents: report, immediate LTI/Fatal notification (in-app), investigation,
-- corrective actions, close/cancel and the K3 summary with LTI-free days and
-- LTIFR. PRD K3-01 … K3-05 (change: add-k3-incidents). No email (decision 2026-11-06).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  project_id uuid not null references public.projects (id) on delete restrict,
  occurred_at timestamptz not null,
  section_id uuid references public.project_sections (id) on delete restrict,
  location_note text,
  classification text not null
    check (classification in ('near_miss', 'first_aid', 'medical', 'lti', 'fatal', 'property')),
  chronology text not null check (length(btrim(chronology)) > 0),
  body_parts text,
  witnesses text,
  immediate_action text,
  status text not null default 'reported' check (status in ('reported', 'investigating', 'closed', 'cancelled')),
  direct_cause text,
  root_cause text check (root_cause in ('human', 'equipment', 'method', 'environment', 'material')),
  lost_days integer not null default 0 check (lost_days >= 0),
  investigated_by uuid references public.profiles (id) on delete set null,
  investigated_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  closed_at timestamptz,
  cancel_reason text,
  cancelled_at timestamptz,
  reported_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incidents_project_idx on public.incidents (project_id, occurred_at desc);

create trigger incidents_set_updated_at
before update on public.incidents
for each row execute function public.set_updated_at();

create trigger incidents_audit
after insert or update on public.incidents
for each row execute function public.audit_row_change('id');

create table public.incident_people (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  employee_id uuid references public.employees (id) on delete restrict,
  external_name text,
  involvement text not null default 'victim' check (involvement in ('victim', 'involved')),
  injury text,
  sort_order integer not null default 0,
  check ((employee_id is null) <> (nullif(btrim(external_name), '') is null))
);

create index incident_people_incident_idx on public.incident_people (incident_id, sort_order);

create table public.incident_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  description text not null check (length(btrim(description)) > 0),
  pic_employee_id uuid not null references public.employees (id) on delete restrict,
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'done')),
  done_note text,
  done_at timestamptz,
  done_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incident_actions_incident_idx on public.incident_actions (incident_id, due_date);

create trigger incident_actions_set_updated_at
before update on public.incident_actions
for each row execute function public.set_updated_at();

create trigger incident_actions_audit
after insert or update on public.incident_actions
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- K3-02: LTI/Fatal notify Direktur and Operasional in the same transaction
-- ---------------------------------------------------------------------------
create or replace function public.incidents_notify_serious()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.classification in ('lti', 'fatal') and new.status <> 'cancelled'
     and (tg_op = 'INSERT' or old.classification not in ('lti', 'fatal')) then
    perform public.notify_roles(
      array['director', 'operations']::public.app_role[],
      'k3',
      case new.classification when 'lti' then 'Insiden LTI' else 'Insiden Fatal' end,
      format('%s · %s · %s', new.number, (select code from public.projects where id = new.project_id),
        to_char(new.occurred_at at time zone 'Asia/Jakarta', 'DD/MM/YYYY HH24:MI')),
      '/operations/incidents/' || new.id,
      'incident-serious:' || new.id
    );
  end if;
  return new;
end;
$$;

create trigger incidents_notify_serious
after insert or update of classification on public.incidents
for each row execute function public.incidents_notify_serious();

-- ---------------------------------------------------------------------------
-- Functions (K3-01, K3-03, K3-04)
-- p_incident: { project_id, occurred_at, section_id, location_note, classification,
--   chronology, body_parts, witnesses, immediate_action }
-- p_people: [{ employee_id | external_name, involvement, injury }]
-- ---------------------------------------------------------------------------
create or replace function public.save_incident(p_id uuid, p_incident jsonb, p_people jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid := (p_incident ->> 'project_id')::uuid;
  v_section uuid := nullif(p_incident ->> 'section_id', '')::uuid;
  v_occurred timestamptz := (p_incident ->> 'occurred_at')::timestamptz;
  v_class text := p_incident ->> 'classification';
  v_status text;
  v_id uuid := p_id;
  v_person jsonb;
  v_employee uuid;
  v_external text;
  v_position integer := 0;
begin
  if v_project is null or not exists (select 1 from public.projects where id = v_project) then
    raise exception 'Proyek tidak valid';
  end if;
  if p_id is null then
    if not (public.has_role('operations')
            or (public.has_role('field') and v_project in (select public.user_project_ids()))) then
      raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
    end if;
  else
    if not public.has_role('operations') then
      raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
    end if;
    select status into v_status from public.incidents where id = p_id for update;
    if not found then
      raise exception 'Insiden tidak ditemukan';
    end if;
    if v_status in ('closed', 'cancelled') then
      raise exception 'Insiden yang sudah ditutup atau batal tidak dapat diubah';
    end if;
  end if;
  if v_occurred is null or v_occurred > now() + interval '5 minutes' then
    raise exception 'Waktu kejadian kosong atau di masa depan';
  end if;
  if v_class is null or v_class not in ('near_miss', 'first_aid', 'medical', 'lti', 'fatal', 'property') then
    raise exception 'Pilih klasifikasi insiden';
  end if;
  if length(btrim(coalesce(p_incident ->> 'chronology', ''))) = 0 then
    raise exception 'Isi kronologi kejadian';
  end if;
  if v_section is not null and not exists (
    select 1 from public.project_sections s where s.id = v_section and s.project_id = v_project
  ) then
    raise exception 'Seksi tidak valid untuk proyek ini';
  end if;

  if p_id is null then
    insert into public.incidents (
      number, project_id, occurred_at, section_id, location_note, classification, chronology,
      body_parts, witnesses, immediate_action
    ) values (
      public.next_document_number('incident', (v_occurred at time zone 'Asia/Jakarta')::date),
      v_project, v_occurred, v_section,
      nullif(btrim(p_incident ->> 'location_note'), ''), v_class, btrim(p_incident ->> 'chronology'),
      nullif(btrim(p_incident ->> 'body_parts'), ''), nullif(btrim(p_incident ->> 'witnesses'), ''),
      nullif(btrim(p_incident ->> 'immediate_action'), '')
    )
    returning id into v_id;
  else
    update public.incidents
    set project_id = v_project,
        occurred_at = v_occurred,
        section_id = v_section,
        location_note = nullif(btrim(p_incident ->> 'location_note'), ''),
        classification = v_class,
        chronology = btrim(p_incident ->> 'chronology'),
        body_parts = nullif(btrim(p_incident ->> 'body_parts'), ''),
        witnesses = nullif(btrim(p_incident ->> 'witnesses'), ''),
        immediate_action = nullif(btrim(p_incident ->> 'immediate_action'), '')
    where id = p_id;
    delete from public.incident_people where incident_id = p_id;
  end if;

  for v_person in select value from jsonb_array_elements(coalesce(p_people, '[]'::jsonb))
  loop
    v_position := v_position + 1;
    v_employee := nullif(v_person ->> 'employee_id', '')::uuid;
    v_external := nullif(btrim(v_person ->> 'external_name'), '');
    if (v_employee is null) = (v_external is null) then
      raise exception 'Orang terlibat ke-% : pilih karyawan atau isi nama pihak luar', v_position;
    end if;
    insert into public.incident_people (incident_id, employee_id, external_name, involvement, injury, sort_order)
    values (
      v_id, v_employee, v_external, coalesce(nullif(v_person ->> 'involvement', ''), 'victim'),
      nullif(btrim(v_person ->> 'injury'), ''), v_position
    );
  end loop;
  return v_id;
end;
$$;

-- p_values: { direct_cause, root_cause, lost_days }
create or replace function public.save_incident_investigation(p_id uuid, p_values jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_root text := nullif(p_values ->> 'root_cause', '');
  v_days integer := coalesce((p_values ->> 'lost_days')::integer, 0);
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select status into v_status from public.incidents where id = p_id for update;
  if not found then
    raise exception 'Insiden tidak ditemukan';
  end if;
  if v_status in ('closed', 'cancelled') then
    raise exception 'Insiden yang sudah ditutup atau batal tidak dapat diubah';
  end if;
  if v_root is null or v_root not in ('human', 'equipment', 'method', 'environment', 'material') then
    raise exception 'Pilih akar masalah';
  end if;
  if v_days < 0 then
    raise exception 'Hari kerja hilang tidak boleh negatif';
  end if;
  update public.incidents
  set direct_cause = nullif(btrim(p_values ->> 'direct_cause'), ''),
      root_cause = v_root,
      lost_days = v_days,
      investigated_by = auth.uid(),
      investigated_at = now(),
      status = case when status = 'reported' then 'investigating' else status end
  where id = p_id;
end;
$$;

-- p_values: { description, pic_employee_id, due_date }; p_id null = new action.
create or replace function public.save_incident_action(p_id uuid, p_incident uuid, p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_incident uuid := p_incident;
  v_status text;
  v_id uuid := p_id;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if p_id is not null then
    select incident_id into v_incident from public.incident_actions where id = p_id;
    if not found then
      raise exception 'Tindakan tidak ditemukan';
    end if;
  end if;
  select status into v_status from public.incidents where id = v_incident for update;
  if not found then
    raise exception 'Insiden tidak ditemukan';
  end if;
  if v_status in ('closed', 'cancelled') then
    raise exception 'Insiden yang sudah ditutup atau batal tidak dapat diubah';
  end if;
  if length(btrim(coalesce(p_values ->> 'description', ''))) = 0 then
    raise exception 'Isi uraian tindakan';
  end if;
  if nullif(p_values ->> 'pic_employee_id', '') is null then
    raise exception 'Pilih PIC tindakan';
  end if;
  if nullif(p_values ->> 'due_date', '') is null then
    raise exception 'Isi tenggat tindakan';
  end if;

  if p_id is null then
    insert into public.incident_actions (incident_id, description, pic_employee_id, due_date)
    values (v_incident, btrim(p_values ->> 'description'), (p_values ->> 'pic_employee_id')::uuid, (p_values ->> 'due_date')::date)
    returning id into v_id;
  else
    update public.incident_actions
    set description = btrim(p_values ->> 'description'),
        pic_employee_id = (p_values ->> 'pic_employee_id')::uuid,
        due_date = (p_values ->> 'due_date')::date
    where id = p_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.complete_incident_action(p_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action record;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select a.id, a.status, i.status as incident_status into v_action
  from public.incident_actions a join public.incidents i on i.id = a.incident_id
  where a.id = p_id for update of a;
  if not found then
    raise exception 'Tindakan tidak ditemukan';
  end if;
  if v_action.incident_status in ('closed', 'cancelled') then
    raise exception 'Insiden yang sudah ditutup atau batal tidak dapat diubah';
  end if;
  if v_action.status = 'done' then
    raise exception 'Tindakan sudah Selesai';
  end if;
  update public.incident_actions
  set status = 'done', done_note = nullif(btrim(p_note), ''), done_at = now(), done_by = auth.uid()
  where id = p_id;
end;
$$;

create or replace function public.close_incident(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_incident record;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select id, status, root_cause into v_incident from public.incidents where id = p_id for update;
  if not found then
    raise exception 'Insiden tidak ditemukan';
  end if;
  if v_incident.status in ('closed', 'cancelled') then
    raise exception 'Insiden sudah ditutup atau batal';
  end if;
  if v_incident.root_cause is null then
    raise exception 'Isi investigasi (akar masalah) sebelum menutup insiden';
  end if;
  if exists (select 1 from public.incident_actions where incident_id = p_id and status = 'open') then
    raise exception 'Semua tindakan perbaikan harus Selesai sebelum insiden ditutup';
  end if;
  update public.incidents set status = 'closed', closed_at = now(), closed_by = auth.uid() where id = p_id;
end;
$$;

create or replace function public.cancel_incident(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  select status into v_status from public.incidents where id = p_id for update;
  if not found then
    raise exception 'Insiden tidak ditemukan';
  end if;
  if v_status in ('closed', 'cancelled') then
    raise exception 'Insiden sudah ditutup atau batal';
  end if;
  update public.incidents
  set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now()
  where id = p_id;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.save_incident(uuid, jsonb, jsonb)',
    'public.save_incident_investigation(uuid, jsonb)',
    'public.save_incident_action(uuid, uuid, jsonb)',
    'public.complete_incident_action(uuid, text)',
    'public.close_incident(uuid)',
    'public.cancel_incident(uuid, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Views and summary (K3-05, PRD §11.6)
-- ---------------------------------------------------------------------------
create view public.incident_list
with (security_invoker = true)
as
select
  i.id,
  i.number,
  i.project_id,
  p.code as project_code,
  p.name as project_name,
  i.occurred_at,
  (i.occurred_at at time zone 'Asia/Jakarta')::date as occurred_on,
  i.section_id,
  s.code as section_code,
  i.location_note,
  i.classification,
  i.chronology,
  i.body_parts,
  i.witnesses,
  i.immediate_action,
  i.status,
  i.direct_cause,
  i.root_cause,
  i.lost_days,
  i.investigated_by,
  i.investigated_at,
  i.closed_by,
  i.closed_at,
  i.cancel_reason,
  i.cancelled_at,
  i.reported_by,
  i.created_at,
  coalesce(a.total, 0)::int as action_count,
  coalesce(a.open_count, 0)::int as open_actions,
  coalesce(a.overdue_count, 0)::int as overdue_actions
from public.incidents i
join public.projects p on p.id = i.project_id
left join public.project_sections s on s.id = i.section_id
left join lateral (
  select
    count(*) as total,
    count(*) filter (where x.status = 'open') as open_count,
    count(*) filter (where x.status = 'open' and x.due_date < public.today_wib()) as overdue_count
  from public.incident_actions x
  where x.incident_id = i.id
) a on true;

-- One row per project plus a company row (project_id null), for a period.
create or replace function public.k3_stats(p_from date, p_to date)
returns table (
  project_id uuid,
  project_code text,
  project_name text,
  near_miss integer,
  first_aid integer,
  medical integer,
  lti integer,
  fatal integer,
  property integer,
  total integer,
  open_actions integer,
  overdue_actions integer,
  work_hours numeric,
  ltifr numeric,
  last_lti_date date,
  lti_free_days integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with settings as (
    select coalesce((select standard_work_hours from public.system_parameters limit 1), 8) as hours_per_day
  ),
  inc as (
    select i.id, i.project_id, i.classification, (i.occurred_at at time zone 'Asia/Jakarta')::date as occurred_on
    from public.incidents i
    where i.status <> 'cancelled'
  ),
  rows as (
    select
      p.id as project_id, p.code as project_code, p.name as project_name, p.start_date,
      c.near_miss, c.first_aid, c.medical, c.lti, c.fatal, c.property, c.total,
      a.open_actions, a.overdue_actions, h.work_hours, l.last_lti_date, 0 as sort_group
    from public.projects p
    cross join settings st
    cross join lateral (
      select
        count(*) filter (where inc.classification = 'near_miss')::int as near_miss,
        count(*) filter (where inc.classification = 'first_aid')::int as first_aid,
        count(*) filter (where inc.classification = 'medical')::int as medical,
        count(*) filter (where inc.classification = 'lti')::int as lti,
        count(*) filter (where inc.classification = 'fatal')::int as fatal,
        count(*) filter (where inc.classification = 'property')::int as property,
        count(*)::int as total
      from inc
      where inc.project_id = p.id and inc.occurred_on between p_from and p_to
    ) c
    cross join lateral (
      select
        count(*) filter (where x.status = 'open')::int as open_actions,
        count(*) filter (where x.status = 'open' and x.due_date < public.today_wib())::int as overdue_actions
      from public.incident_actions x
      join inc on inc.id = x.incident_id
      where inc.project_id = p.id
    ) a
    cross join lateral (
      select coalesce(sum(case when t.status = 'present' then st.hours_per_day else 0 end + t.overtime_hours), 0) as work_hours
      from public.attendance t
      where t.project_id = p.id and t.work_date between p_from and p_to
    ) h
    cross join lateral (
      select max(inc.occurred_on) as last_lti_date
      from inc
      where inc.project_id = p.id and inc.classification in ('lti', 'fatal')
    ) l
    union all
    select
      null, null, 'Perusahaan', (select min(start_date) from public.projects),
      count(*) filter (where c.classification = 'near_miss' and c.in_period)::int,
      count(*) filter (where c.classification = 'first_aid' and c.in_period)::int,
      count(*) filter (where c.classification = 'medical' and c.in_period)::int,
      count(*) filter (where c.classification = 'lti' and c.in_period)::int,
      count(*) filter (where c.classification = 'fatal' and c.in_period)::int,
      count(*) filter (where c.classification = 'property' and c.in_period)::int,
      count(*) filter (where c.in_period)::int,
      (select count(*) from public.incident_actions x join inc on inc.id = x.incident_id where x.status = 'open')::int,
      (select count(*) from public.incident_actions x join inc on inc.id = x.incident_id
       where x.status = 'open' and x.due_date < public.today_wib())::int,
      (select coalesce(sum(case when t.status = 'present' then st.hours_per_day else 0 end + t.overtime_hours), 0)
       from public.attendance t cross join settings st where t.work_date between p_from and p_to),
      (select max(occurred_on) from inc where classification in ('lti', 'fatal')),
      1
    from (select inc.*, inc.occurred_on between p_from and p_to as in_period from inc) c
  )
  select
    r.project_id, r.project_code, r.project_name,
    r.near_miss, r.first_aid, r.medical, r.lti, r.fatal, r.property, r.total,
    r.open_actions, r.overdue_actions, r.work_hours,
    case when r.work_hours > 0 then round((r.lti + r.fatal) * 1000000.0 / r.work_hours, 2) end,
    r.last_lti_date,
    case
      when r.last_lti_date is not null then public.today_wib() - r.last_lti_date
      when r.start_date <= public.today_wib() then public.today_wib() - r.start_date
    end
  from rows r
  order by r.sort_group, r.project_code
$$;

revoke execute on function public.k3_stats(date, date) from public, anon;
grant execute on function public.k3_stats(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Attachments: incident photos and action evidence in a private K3 bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('k3-files', 'k3-files', false, 10485760,
        array[
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ])
on conflict (id) do nothing;

create policy "Attachment readers read k3 files" on storage.objects
  for select to authenticated
  using (bucket_id = 'k3-files' and public.can_access_attachment_path(name, false));

create policy "Attachment writers upload k3 files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'k3-files' and public.can_access_attachment_path(name, true));

create policy "Attachment writers delete k3 files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'k3-files' and public.can_access_attachment_path(name, true));

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
    when 'daily_report' then 'project-files'
    when 'tool' then 'project-files'
    when 'delivery_note' then 'project-files'
    when 'material_transaction' then 'project-files'
    when 'incident' then 'k3-files'
    when 'incident_action' then 'k3-files'
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
    when 'daily_report' then
      exists (select 1 from public.daily_reports r where r.id = p_entity_id)
    when 'tool' then
      exists (select 1 from public.tools t where t.id = p_entity_id)
    when 'delivery_note' then
      exists (select 1 from public.delivery_notes n where n.id = p_entity_id)
    when 'material_transaction' then
      exists (select 1 from public.material_transactions t where t.id = p_entity_id)
    when 'incident' then
      exists (select 1 from public.incidents i where i.id = p_entity_id)
    when 'incident_action' then
      exists (select 1 from public.incident_actions a where a.id = p_entity_id)
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
    when 'daily_report' then
      public.has_role('operations', 'field')
      and p_category = 'photo'
      and exists (select 1 from public.daily_reports r where r.id = p_entity_id and r.status <> 'reviewed')
      and (
        select count(*) from public.attachments f
        where f.entity_type = 'daily_report' and f.entity_id = p_entity_id and f.category = 'photo'
      ) < 10
    when 'tool' then
      exists (select 1 from public.tools t where t.id = p_entity_id)
      and (
        (p_category = 'photo' and public.has_role('operations'))
        or (p_category = 'condition' and public.has_role('operations', 'field'))
      )
    when 'delivery_note' then
      p_category = 'receipt'
      and (
        public.has_role('operations')
        or (public.has_role('field') and exists (
          select 1 from public.delivery_notes n
          where n.id = p_entity_id and n.status = 'sent' and n.to_location_id in (select public.user_location_ids())
        ))
      )
    when 'material_transaction' then
      p_category = 'document'
      and (
        (public.has_role('operations') and exists (
          select 1 from public.material_transactions t where t.id = p_entity_id
        ))
        or (public.has_role('field') and exists (
          select 1 from public.material_transactions t
          where t.id = p_entity_id and t.status = 'active' and t.location_id in (select public.user_location_ids())
        ))
      )
    when 'incident' then
      p_category = 'photo'
      and public.has_role('operations', 'field')
      and exists (
        select 1 from public.incidents i
        where i.id = p_entity_id and i.status not in ('closed', 'cancelled')
      )
      and (
        select count(*) from public.attachments f
        where f.entity_type = 'incident' and f.entity_id = p_entity_id and f.category = 'photo'
      ) < 10
    when 'incident_action' then
      p_category = 'evidence'
      and public.has_role('operations')
      and exists (select 1 from public.incident_actions a where a.id = p_entity_id)
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Insiden K3 L L — — L K K(P: lapor))
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['incidents', 'incident_people', 'incident_actions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
    execute format(
      'create policy "K3 readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''hcm'', ''operations'')))', t);
  end loop;
end;
$$;

create policy "Lapangan reads incidents of their projects" on public.incidents
  for select to authenticated
  using ((select public.has_role('field')) and project_id in (select public.user_project_ids()));

create policy "Lapangan reads incident people" on public.incident_people
  for select to authenticated
  using ((select public.has_role('field')) and incident_id in (select i.id from public.incidents i));

create policy "Lapangan reads incident actions" on public.incident_actions
  for select to authenticated
  using ((select public.has_role('field')) and incident_id in (select i.id from public.incidents i));

revoke all on table public.incident_list from anon;

-- K3-05 / DSB-03: incidents per month and classification.
create view public.incident_monthly
with (security_invoker = true)
as
select
  i.project_id,
  date_trunc('month', (i.occurred_at at time zone 'Asia/Jakarta'))::date as month,
  i.classification,
  count(*)::int as count
from public.incidents i
where i.status <> 'cancelled'
group by 1, 2, 3;

revoke all on table public.incident_monthly from anon;
