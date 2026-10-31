-- Daily reports from the field with activities that update section progress,
-- obstacles, review, missing-report reminders and photos. PRD OPS-01 …
-- OPS-04, UMM-12 (change: add-daily-reports).

-- Field input window (PRD §5 A5): the backdate_days system parameter.
create or replace function public.backdate_days()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select backdate_days from public.system_parameters limit 1), 3)
$$;

-- ---------------------------------------------------------------------------
-- Daily reports (OPS-01, OPS-02)
-- ---------------------------------------------------------------------------
create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  report_date date not null,
  status text not null default 'submitted' check (status in ('submitted', 'revision', 'reviewed')),
  no_activity boolean not null default false,
  no_activity_reason text,
  weather_morning text check (weather_morning in ('clear', 'cloudy', 'rain', 'heavy_rain')),
  weather_midday text check (weather_midday in ('clear', 'cloudy', 'rain', 'heavy_rain')),
  weather_afternoon text check (weather_afternoon in ('clear', 'cloudy', 'rain', 'heavy_rain')),
  effective_hours numeric(4, 1) check (effective_hours between 0 and 24),
  safety_briefing boolean not null default false,
  briefing_participants integer check (briefing_participants >= 0),
  equipment_used text,
  plan_tomorrow text,
  notes text,
  submitted_by uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, report_date),
  check (not no_activity or length(btrim(coalesce(no_activity_reason, ''))) > 0),
  check (safety_briefing or briefing_participants is null)
);

create index daily_reports_date_idx on public.daily_reports (report_date desc);

create trigger daily_reports_set_updated_at
before update on public.daily_reports
for each row execute function public.set_updated_at();

create trigger daily_reports_audit
after insert or update on public.daily_reports
for each row execute function public.audit_row_change('id');

create table public.daily_report_activities (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports (id) on delete cascade,
  section_id uuid not null references public.project_sections (id) on delete restrict,
  stage_id uuid not null references public.project_stages (id) on delete restrict,
  progress_after numeric(5, 2) not null check (progress_after between 0 and 100),
  notes text,
  sort_order integer not null default 0
);

create index daily_report_activities_report_idx on public.daily_report_activities (report_id, sort_order);

create table public.daily_report_obstacles (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports (id) on delete cascade,
  category text not null check (
    category in ('weather', 'row_land', 'material_late', 'equipment_broken', 'outage_permit', 'labor', 'other')
  ),
  description text not null check (length(btrim(description)) > 0),
  sort_order integer not null default 0
);

create index daily_report_obstacles_report_idx on public.daily_report_obstacles (report_id, sort_order);

-- The progress log now names its report.
alter table public.progress_updates
  add constraint progress_updates_daily_report_id_fkey
  foreign key (daily_report_id) references public.daily_reports (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Saving a report (OPS-01): one per project and date, progress applied
-- p_report: { no_activity, no_activity_reason, weather_morning, weather_midday,
--   weather_afternoon, effective_hours, safety_briefing, briefing_participants,
--   equipment_used, plan_tomorrow, notes }
-- p_activities: [{ section_id, stage_id, progress_after, notes }]
-- p_obstacles: [{ category, description }]
-- ---------------------------------------------------------------------------
create or replace function public.save_daily_report(
  p_project uuid,
  p_date date,
  p_report jsonb,
  p_activities jsonb,
  p_obstacles jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_field boolean := public.has_role('field');
  project record;
  existing record;
  saved_id uuid;
  is_no_activity boolean := coalesce((p_report ->> 'no_activity')::boolean, false);
  item jsonb;
  position_index integer := 0;
  section_project uuid;
  stage_project uuid;
  current_value numeric;
  value numeric;
  section_code text;
  stage_name text;
begin
  if not (public.has_role('operations') or is_field) then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if is_field and (p_project is null or p_project not in (select public.user_project_ids())) then
    raise exception 'Anda tidak ditugaskan di proyek ini' using errcode = '42501';
  end if;

  select id, code, status into project from public.projects where id = p_project;
  if not found then
    raise exception 'Proyek tidak ditemukan';
  end if;
  if project.status = 'closed' then
    raise exception 'Proyek sudah ditutup';
  end if;
  if p_date is null or p_date > public.today_wib() then
    raise exception 'Laporan tidak dapat dibuat untuk tanggal mendatang';
  end if;

  select id, status into existing
  from public.daily_reports
  where project_id = p_project and report_date = p_date
  for update;

  if found and existing.status = 'reviewed' then
    raise exception 'Laporan sudah diperiksa dan tidak dapat diubah';
  end if;
  if is_field and p_date < public.today_wib() - public.backdate_days()
     and not (found and existing.status = 'revision') then
    raise exception 'Input laporan lapangan paling lambat H+%; hubungi Operasional untuk tanggal %',
      public.backdate_days(), public.format_date_id(p_date);
  end if;

  if is_no_activity then
    if length(btrim(coalesce(p_report ->> 'no_activity_reason', ''))) = 0 then
      raise exception 'Isi alasan Tidak Ada Kegiatan';
    end if;
    if jsonb_array_length(coalesce(p_activities, '[]'::jsonb)) > 0
       or jsonb_array_length(coalesce(p_obstacles, '[]'::jsonb)) > 0 then
      raise exception 'Laporan Tidak Ada Kegiatan tidak memuat aktivitas atau kendala';
    end if;
  end if;

  if existing.id is null then
    insert into public.daily_reports (project_id, report_date) values (p_project, p_date)
    returning id into saved_id;
  else
    saved_id := existing.id;
  end if;

  update public.daily_reports
  set status = 'submitted',
      no_activity = is_no_activity,
      no_activity_reason = case when is_no_activity then btrim(p_report ->> 'no_activity_reason') end,
      weather_morning = nullif(p_report ->> 'weather_morning', ''),
      weather_midday = nullif(p_report ->> 'weather_midday', ''),
      weather_afternoon = nullif(p_report ->> 'weather_afternoon', ''),
      effective_hours = case when is_no_activity then null else (p_report ->> 'effective_hours')::numeric end,
      safety_briefing = not is_no_activity and coalesce((p_report ->> 'safety_briefing')::boolean, false),
      briefing_participants = case
        when not is_no_activity and coalesce((p_report ->> 'safety_briefing')::boolean, false)
        then (p_report ->> 'briefing_participants')::integer
      end,
      equipment_used = case when is_no_activity then null else nullif(btrim(p_report ->> 'equipment_used'), '') end,
      plan_tomorrow = nullif(btrim(p_report ->> 'plan_tomorrow'), ''),
      notes = nullif(btrim(p_report ->> 'notes'), ''),
      submitted_by = auth.uid(),
      submitted_at = now()
  where id = saved_id;

  delete from public.daily_report_activities where report_id = saved_id;
  delete from public.daily_report_obstacles where report_id = saved_id;

  for item in select * from jsonb_array_elements(coalesce(p_activities, '[]'::jsonb))
  loop
    position_index := position_index + 1;
    value := (item ->> 'progress_after')::numeric;
    if value is null or value < 0 or value > 100 then
      raise exception 'Progres aktivitas harus 0–100%%';
    end if;
    select s.project_id, s.code into section_project, section_code
    from public.project_sections s where s.id = (item ->> 'section_id')::uuid;
    select st.project_id, st.name into stage_project, stage_name
    from public.project_stages st where st.id = (item ->> 'stage_id')::uuid;
    if section_project is distinct from p_project or stage_project is distinct from p_project then
      raise exception 'Seksi atau tahapan bukan milik proyek ini';
    end if;

    select progress into current_value
    from public.section_progress
    where section_id = (item ->> 'section_id')::uuid and stage_id = (item ->> 'stage_id')::uuid;
    if value < coalesce(current_value, 0) then
      raise exception 'Progres % · % tidak boleh turun (sekarang %)',
        section_code, stage_name, trim_scale(current_value) || '%';
    end if;

    insert into public.daily_report_activities (report_id, section_id, stage_id, progress_after, notes, sort_order)
    values (saved_id, (item ->> 'section_id')::uuid, (item ->> 'stage_id')::uuid, value,
            nullif(btrim(item ->> 'notes'), ''), position_index);

    perform public.apply_stage_progress(
      (item ->> 'section_id')::uuid, (item ->> 'stage_id')::uuid, value, 'daily_report', saved_id,
      nullif(btrim(item ->> 'notes'), ''), auth.uid()
    );
  end loop;

  position_index := 0;
  for item in select * from jsonb_array_elements(coalesce(p_obstacles, '[]'::jsonb))
  loop
    position_index := position_index + 1;
    insert into public.daily_report_obstacles (report_id, category, description, sort_order)
    values (saved_id, item ->> 'category', btrim(item ->> 'description'), position_index);
  end loop;

  perform public.check_progress_terms(p_project);
  return saved_id;
end;
$$;

revoke execute on function public.save_daily_report(uuid, date, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_daily_report(uuid, date, jsonb, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Review by Operasional (OPS-03)
-- ---------------------------------------------------------------------------
create or replace function public.review_daily_report(p_report uuid, p_action text, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  report record;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select r.id, r.status, r.submitted_by, r.report_date, p.code
  into report
  from public.daily_reports r
  join public.projects p on p.id = r.project_id
  where r.id = p_report
  for update of r;
  if not found then
    raise exception 'Laporan tidak ditemukan';
  end if;
  if report.status = 'reviewed' then
    raise exception 'Laporan sudah diperiksa';
  end if;

  if p_action = 'reviewed' then
    update public.daily_reports
    set status = 'reviewed', reviewed_by = auth.uid(), reviewed_at = now(),
        review_comment = nullif(btrim(p_comment), '')
    where id = p_report;
  elsif p_action = 'revision' then
    if length(btrim(coalesce(p_comment, ''))) = 0 then
      raise exception 'Isi komentar revisi';
    end if;
    update public.daily_reports
    set status = 'revision', reviewed_by = auth.uid(), reviewed_at = now(), review_comment = btrim(p_comment)
    where id = p_report;
    if report.submitted_by is not null then
      perform public.notify_user(
        report.submitted_by,
        'daily_report',
        'Laporan harian perlu revisi',
        format('%s · %s · %s', report.code, public.format_date_id(report.report_date), btrim(p_comment)),
        '/operations/daily-reports/' || p_report,
        'report-revision:' || p_report || ':' || extract(epoch from clock_timestamp())::bigint
      );
    end if;
  else
    raise exception 'Tindakan tidak dikenal';
  end if;
end;
$$;

revoke execute on function public.review_daily_report(uuid, text, text) from public, anon;
grant execute on function public.review_daily_report(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------
create view public.daily_report_list
with (security_invoker = true)
as
select
  r.id,
  r.project_id,
  r.report_date,
  r.status,
  r.no_activity,
  r.no_activity_reason,
  r.weather_morning,
  r.weather_midday,
  r.weather_afternoon,
  r.effective_hours,
  r.safety_briefing,
  r.briefing_participants,
  r.equipment_used,
  r.plan_tomorrow,
  r.notes,
  r.submitted_by,
  r.submitted_at,
  r.reviewed_by,
  r.reviewed_at,
  r.review_comment,
  p.code as project_code,
  p.name as project_name,
  -- Tenaga kerja: crew marked Hadir on the project that day (OPS-01).
  (select count(*) from public.attendance a
   where a.project_id = r.project_id and a.work_date = r.report_date and a.status = 'present')::int as workforce,
  (select count(*) from public.daily_report_activities x where x.report_id = r.id)::int as activity_count,
  (select count(*) from public.daily_report_obstacles o where o.report_id = r.id)::int as obstacle_count,
  (select count(*) from public.attachments f
   where f.entity_type = 'daily_report' and f.entity_id = r.id and f.category = 'photo')::int as photo_count
from public.daily_reports r
join public.projects p on p.id = r.project_id;

-- OPS-02 recap per project and category.
create view public.daily_report_obstacle_summary
with (security_invoker = true)
as
select r.project_id, o.category, count(*)::int as obstacle_count, max(r.report_date) as last_date
from public.daily_report_obstacles o
join public.daily_reports r on r.id = o.report_id
group by r.project_id, o.category;

-- OPS-03: running projects without a report for yesterday.
create view public.missing_daily_reports
with (security_invoker = true)
as
select p.id as project_id, p.code, p.name, public.today_wib() - 1 as report_date
from public.projects p
where p.status = 'running'
  and not exists (
    select 1 from public.daily_reports r
    where r.project_id = p.id and r.report_date = public.today_wib() - 1
  );

-- Daily: tell Operasional which running projects sent nothing yesterday.
create or replace function public.check_missing_daily_reports()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  missing record;
begin
  for missing in select * from public.missing_daily_reports
  loop
    perform public.notify_roles(
      array['operations']::public.app_role[],
      'daily_report',
      'Laporan harian belum masuk',
      format('%s · %s · %s', missing.code, missing.name, public.format_date_id(missing.report_date)),
      '/projects/' || missing.project_id || '/reports',
      format('report-missing:%s:%s', missing.project_id, missing.report_date)
    );
  end loop;
end;
$$;

revoke execute on function public.check_missing_daily_reports() from public, anon, authenticated;

insert into public.scheduled_checks (name, function_name, description, sort_order) values
  ('daily-reports-missing', 'public.check_missing_daily_reports()',
   'Proyek Berjalan yang belum mengirim laporan harian kemarin (OPS-03)', 50);

-- ---------------------------------------------------------------------------
-- Progress: lowering needs a reason (PRJ-06)
-- ---------------------------------------------------------------------------
create or replace function public.update_section_progress(p_section uuid, p_progress jsonb, p_note text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
  item jsonb;
  stage_project uuid;
  value numeric;
  current_value numeric;
  changed integer := 0;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;

  select s.id, s.project_id, p.status
  into target
  from public.project_sections s
  join public.projects p on p.id = s.project_id
  where s.id = p_section;
  if not found then
    raise exception 'Seksi tidak ditemukan';
  end if;
  if target.status = 'closed' then
    raise exception 'Proyek sudah ditutup; progres tidak dapat diubah';
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_progress, '[]'::jsonb))
  loop
    value := (item ->> 'progress')::numeric;
    if value is null or value < 0 or value > 100 then
      raise exception 'Progres tahap harus 0–100%%';
    end if;
    select project_id into stage_project from public.project_stages where id = (item ->> 'stage_id')::uuid;
    if stage_project is distinct from target.project_id then
      raise exception 'Tahapan bukan milik proyek ini';
    end if;
    select progress into current_value
    from public.section_progress
    where section_id = p_section and stage_id = (item ->> 'stage_id')::uuid;
    if value < coalesce(current_value, 0) and length(btrim(coalesce(p_note, ''))) = 0 then
      raise exception 'Progres diturunkan: isi catatan alasannya';
    end if;
    if public.apply_stage_progress(
      p_section, (item ->> 'stage_id')::uuid, value, 'manual', null, nullif(btrim(p_note), ''), auth.uid()
    ) then
      changed := changed + 1;
    end if;
  end loop;

  perform public.check_progress_terms(target.project_id);
  return changed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attendance: field window follows backdate_days (PRD §5 A5)
-- ---------------------------------------------------------------------------
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
  if public.has_role('field') and new.work_date < public.today_wib() - public.backdate_days() then
    raise exception 'Input absensi lapangan paling lambat H+%; hubungi HCM untuk tanggal %',
      public.backdate_days(), public.format_date_id(new.work_date);
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

-- ---------------------------------------------------------------------------
-- Attachments: report photos, at most ten (OPS-01)
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
    when 'daily_report' then 'project-files'
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
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Laporan harian L L — — — K+periksa K(P))
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['daily_reports', 'daily_report_activities', 'daily_report_obstacles']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
  end loop;
end;
$$;

create policy "Report readers" on public.daily_reports
  for select to authenticated
  using ((select public.has_role('super_admin', 'director', 'operations')));

create policy "Lapangan reads reports of their projects" on public.daily_reports
  for select to authenticated
  using ((select public.has_role('field')) and project_id in (select public.user_project_ids()));

do $$
declare
  t text;
begin
  foreach t in array array['daily_report_activities', 'daily_report_obstacles']
  loop
    execute format(
      'create policy "Report line readers" on public.%I for select to authenticated '
      'using (report_id in (select r.id from public.daily_reports r))', t);
  end loop;
end;
$$;

revoke all on table public.daily_report_list from anon;
revoke all on table public.daily_report_obstacle_summary from anon;
revoke all on table public.missing_daily_reports from anon;
revoke execute on function public.backdate_days() from public, anon;
grant execute on function public.backdate_days() to authenticated;
