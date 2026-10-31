-- Pulling sections, per-project stages, stage progress with its log, the
-- §11.2 progress formulas, the plan-vs-actual curve and automatic term
-- readiness. PRD PRJ-03, PRJ-05 … PRJ-08 (change: add-sections-progress).

-- ---------------------------------------------------------------------------
-- Project stages (PRJ-06, MST-08): copied from the template per project
-- ---------------------------------------------------------------------------
create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  weight numeric(5, 2) not null check (weight > 0 and weight <= 100),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index project_stages_name_key on public.project_stages (project_id, lower(btrim(name)));

create trigger project_stages_set_updated_at
before update on public.project_stages
for each row execute function public.set_updated_at();

create trigger project_stages_audit
after insert or update on public.project_stages
for each row execute function public.audit_row_change('id');

-- Checked at commit so a multi-row edit can pass through intermediate totals.
create or replace function public.check_project_stage_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target uuid := coalesce(new.project_id, old.project_id);
  total numeric;
  stage_count integer;
begin
  if not exists (select 1 from public.projects where id = target) then
    return null;
  end if;

  select coalesce(sum(weight), 0), count(*) into total, stage_count
  from public.project_stages
  where project_id = target;

  if stage_count = 0 then
    raise exception 'Proyek harus memiliki minimal satu tahapan';
  end if;
  if total <> 100 then
    raise exception 'Total bobot tahapan harus 100 (sekarang %)', trim_scale(total);
  end if;
  return null;
end;
$$;

create constraint trigger project_stages_total
after insert or update or delete on public.project_stages
deferrable initially deferred
for each row execute function public.check_project_stage_total();

create or replace function public.projects_copy_stages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_stages (project_id, name, weight, sort_order)
  select new.id, t.name, t.default_weight, t.sort_order
  from public.stage_templates t
  where t.is_active;
  return null;
end;
$$;

create trigger projects_copy_stages
after insert on public.projects
for each row execute function public.projects_copy_stages();

-- Projects created before this change get the template too.
insert into public.project_stages (project_id, name, weight, sort_order)
select p.id, t.name, t.default_weight, t.sort_order
from public.projects p
cross join public.stage_templates t
where t.is_active
  and not exists (select 1 from public.project_stages s where s.project_id = p.id);

-- ---------------------------------------------------------------------------
-- Pulling sections (PRJ-05)
-- ---------------------------------------------------------------------------
create table public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  code text not null check (length(btrim(code)) > 0),
  tower_from text not null check (length(btrim(tower_from)) > 0),
  tower_to text not null check (length(btrim(tower_to)) > 0),
  tower_count integer check (tower_count >= 0),
  length_km numeric(10, 3) not null check (length_km > 0),
  circuits integer not null check (circuits between 1 and 4),
  -- §11.2: kms seksi = panjang × jumlah sirkuit.
  kms numeric(12, 3) generated always as (length_km * circuits) stored,
  planned_start date not null,
  planned_finish date not null,
  sort_order integer not null default 100,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_finish >= planned_start)
);

create unique index project_sections_code_key on public.project_sections (project_id, lower(btrim(code)));
create index project_sections_project_idx on public.project_sections (project_id, sort_order);

create trigger project_sections_set_updated_at
before update on public.project_sections
for each row execute function public.set_updated_at();

create trigger project_sections_audit
after insert or update on public.project_sections
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- Stage progress (current values) and its log (PRJ-06)
-- ---------------------------------------------------------------------------
create table public.section_progress (
  section_id uuid not null references public.project_sections (id) on delete cascade,
  stage_id uuid not null references public.project_stages (id) on delete cascade,
  progress numeric(5, 2) not null check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  primary key (section_id, stage_id)
);

create index section_progress_stage_idx on public.section_progress (stage_id);

create table public.progress_updates (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  section_id uuid not null references public.project_sections (id) on delete cascade,
  stage_id uuid not null references public.project_stages (id) on delete cascade,
  old_progress numeric(5, 2) not null,
  new_progress numeric(5, 2) not null check (new_progress between 0 and 100),
  source text not null check (source in ('manual', 'daily_report')),
  -- Daily report that set the value; the foreign key arrives with add-daily-reports.
  daily_report_id uuid,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);

create index progress_updates_project_idx on public.progress_updates (project_id, created_at desc);
create index progress_updates_cell_idx on public.progress_updates (section_id, stage_id, created_at desc);

-- A section that has measured progress stays (removing it would rewrite history).
create or replace function public.project_sections_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.projects where id = old.project_id)
     and exists (select 1 from public.section_progress where section_id = old.id and progress > 0) then
    raise exception 'Seksi yang sudah memiliki progres tidak dapat dihapus';
  end if;
  return old;
end;
$$;

create trigger project_sections_guard_delete
before delete on public.project_sections
for each row execute function public.project_sections_guard_delete();

-- ---------------------------------------------------------------------------
-- §11.2 formulas
-- ---------------------------------------------------------------------------
-- Planned progress of one schedule on a date: 0 before start, 100 from the
-- finish, linear in between.
create or replace function public.section_planned_progress(p_start date, p_finish date, p_on date)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_start is null or p_finish is null then 0
    when p_on < p_start then 0
    when p_on >= p_finish then 100
    else round((p_on - p_start)::numeric * 100 / (p_finish - p_start), 4)
  end;
$$;

create view public.section_progress_summary
with (security_invoker = true)
as
select
  s.id,
  s.project_id,
  s.code,
  s.tower_from,
  s.tower_to,
  s.tower_count,
  s.length_km,
  s.circuits,
  s.kms,
  s.planned_start,
  s.planned_finish,
  s.sort_order,
  s.notes,
  -- Progres seksi = Σ(bobot × progres tahap) ÷ Σ bobot.
  coalesce(sp.progress, 0) as progress,
  public.section_planned_progress(s.planned_start, s.planned_finish, public.today_wib()) as planned_progress,
  case
    when coalesce(sp.progress, 0) >= 100 then 'done'
    when coalesce(sp.progress, 0) > 0 then 'in_progress'
    else 'not_started'
  end as state
from public.project_sections s
left join lateral (
  select round(sum(st.weight * coalesce(p.progress, 0)) / nullif(sum(st.weight), 0), 4) as progress
  from public.project_stages st
  left join public.section_progress p on p.stage_id = st.id and p.section_id = s.id
  where st.project_id = s.project_id
) sp on true;

-- Progres proyek = Σ(progres seksi × kms) ÷ Σ kms; rencana likewise; deviasi in points.
create view public.project_progress
with (security_invoker = true)
as
select
  s.project_id,
  count(*)::int as section_count,
  sum(s.kms) as total_kms,
  round(sum(s.progress * s.kms) / nullif(sum(s.kms), 0), 4) as progress,
  round(sum(s.planned_progress * s.kms) / nullif(sum(s.kms), 0), 4) as planned_progress,
  round((sum(s.progress * s.kms) - sum(s.planned_progress * s.kms)) / nullif(sum(s.kms), 0), 4) as deviation
from public.section_progress_summary s
group by s.project_id;

-- The overview gains progress (null for roles that cannot read sections).
create or replace view public.project_overview
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
  (select count(*) from public.project_addenda a where a.project_id = p.id)::int as addendum_count,
  pp.progress,
  pp.planned_progress
from public.projects p
left join public.clients cl on cl.id = p.client_id
left join public.project_contracts c on c.project_id = p.id
left join lateral (
  select a.new_value
  from public.project_addenda a
  where a.project_id = p.id and a.new_value is not null
  order by a.addendum_date desc, a.created_at desc
  limit 1
) av on true
left join public.project_progress pp on pp.project_id = p.id;

-- PRJ-08: weekly plan and actual (actual from the log as of each week's end, WIB).
create or replace function public.project_progress_curve(p_project uuid)
returns table (week_end date, planned numeric, actual numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with sections as (
    select id, kms, planned_start, planned_finish
    from public.project_sections
    where project_id = p_project
  ),
  stages as (
    select id, weight from public.project_stages where project_id = p_project
  ),
  totals as (
    select (select sum(kms) from sections) as total_kms,
           (select sum(weight) from stages) as total_weight
  ),
  bounds as (
    select date_trunc('week', min(planned_start))::date as first_monday,
           greatest(max(planned_finish), public.today_wib()) as last_day
    from sections
  ),
  weeks as (
    select (gs::date + 6) as week_end
    from bounds, generate_series(bounds.first_monday, bounds.last_day, interval '7 days') as gs
    where bounds.first_monday is not null
  ),
  cells as (
    select w.week_end, s.id as section_id, s.kms, s.planned_start, s.planned_finish,
      (
        select sum(st.weight * coalesce((
          select u.new_progress
          from public.progress_updates u
          where u.section_id = s.id
            and u.stage_id = st.id
            and u.created_at < ((w.week_end + 1)::timestamp at time zone 'Asia/Jakarta')
          order by u.created_at desc
          limit 1
        ), 0))
        from stages st
      ) as weighted
    from weeks w
    cross join sections s
  )
  select
    c.week_end,
    round(sum(public.section_planned_progress(c.planned_start, c.planned_finish, c.week_end) * c.kms)
          / nullif((select total_kms from totals), 0), 2) as planned,
    case
      when c.week_end - 6 <= public.today_wib() then
        round(sum(coalesce(c.weighted, 0) / nullif((select total_weight from totals), 0) * c.kms)
              / nullif((select total_kms from totals), 0), 2)
    end as actual
  from cells c
  group by c.week_end
  order by c.week_end;
$$;

-- ---------------------------------------------------------------------------
-- Automatic term readiness (PRJ-03, §11.2)
-- ---------------------------------------------------------------------------
create or replace function public.check_progress_terms(p_project uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_progress numeric;
  term record;
begin
  select progress into current_progress from public.project_progress where project_id = p_project;
  if current_progress is null then
    return;
  end if;

  for term in
    select t.id
    from public.project_terms t
    join public.projects p on p.id = t.project_id
    where t.project_id = p_project
      and t.status = 'not_due'
      and t.condition_type = 'progress'
      and t.condition_progress <= current_progress
      and p.status <> 'closed'
    order by t.sort_order
  loop
    perform public.term_set_ready(term.id, null);
  end loop;
end;
$$;

-- Daily: date terms whose date has arrived.
create or replace function public.check_term_dates()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  term record;
begin
  for term in
    select t.id
    from public.project_terms t
    join public.projects p on p.id = t.project_id
    where t.status = 'not_due'
      and t.condition_type = 'date'
      and t.condition_date <= public.today_wib()
      and p.status <> 'closed'
  loop
    perform public.term_set_ready(term.id, null);
  end loop;
end;
$$;

insert into public.scheduled_checks (name, function_name, description, sort_order) values
  ('term-dates', 'public.check_term_dates()',
   'Termin bersyarat tanggal menjadi Siap Ditagih pada tanggalnya (PRJ-03)', 40);

-- A term saved with a condition that is already met is ready at once.
create or replace function public.project_terms_check_condition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_progress numeric;
begin
  if new.status <> 'not_due' then
    return null;
  end if;

  if new.condition_type = 'date' and new.condition_date <= public.today_wib() then
    perform public.term_set_ready(new.id, null);
  elsif new.condition_type = 'progress' then
    select progress into current_progress from public.project_progress where project_id = new.project_id;
    if current_progress is not null and current_progress >= new.condition_progress then
      perform public.term_set_ready(new.id, null);
    end if;
  end if;
  return null;
end;
$$;

create trigger project_terms_check_condition
after insert or update of condition_type, condition_progress, condition_date on public.project_terms
for each row execute function public.project_terms_check_condition();

-- Sections change the kms weighting, so re-check the project's terms.
create or replace function public.project_sections_check_terms()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.check_progress_terms(coalesce(new.project_id, old.project_id));
  return null;
end;
$$;

create trigger project_sections_check_terms
after insert or update or delete on public.project_sections
for each row execute function public.project_sections_check_terms();

-- ---------------------------------------------------------------------------
-- Progress functions
-- ---------------------------------------------------------------------------
-- Internal: sets one cell and logs it; also used by daily reports later.
create or replace function public.apply_stage_progress(
  p_section uuid,
  p_stage uuid,
  p_progress numeric,
  p_source text,
  p_report uuid,
  p_note text,
  p_by uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  section_project uuid;
  previous numeric;
begin
  select project_id into section_project from public.project_sections where id = p_section;
  select progress into previous
  from public.section_progress
  where section_id = p_section and stage_id = p_stage;

  if coalesce(previous, 0) = p_progress then
    return false;
  end if;

  insert into public.section_progress (section_id, stage_id, progress, updated_at, updated_by)
  values (p_section, p_stage, p_progress, now(), p_by)
  on conflict (section_id, stage_id) do update
    set progress = excluded.progress,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;

  insert into public.progress_updates
    (project_id, section_id, stage_id, old_progress, new_progress, source, daily_report_id, note, created_by)
  values
    (section_project, p_section, p_stage, coalesce(previous, 0), p_progress, p_source, p_report, p_note, p_by);
  return true;
end;
$$;

revoke execute on function public.apply_stage_progress(uuid, uuid, numeric, text, uuid, text, uuid)
  from public, anon, authenticated;

-- Operasional sets the cumulative progress of a section's stages:
-- p_progress = [{ "stage_id": …, "progress": 0–100 }]. Returns the cells changed.
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

revoke execute on function public.update_section_progress(uuid, jsonb, text) from public, anon;
grant execute on function public.update_section_progress(uuid, jsonb, text) to authenticated;

-- Operasional saves the project's stage list at once: rows with id are
-- updated, rows without id inserted, rows not listed deleted (with their
-- progress). The total is checked at commit.
create or replace function public.save_project_stages(p_project uuid, p_stages jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stage jsonb;
  kept uuid[] := '{}';
  saved_id uuid;
  project_status text;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select status into project_status from public.projects where id = p_project;
  if not found then
    raise exception 'Proyek tidak ditemukan';
  end if;
  if project_status = 'closed' then
    raise exception 'Proyek sudah ditutup; tahapan tidak dapat diubah';
  end if;

  for stage in select * from jsonb_array_elements(coalesce(p_stages, '[]'::jsonb))
  loop
    if stage ->> 'id' is not null then
      update public.project_stages
      set name = btrim(stage ->> 'name'),
          weight = (stage ->> 'weight')::numeric,
          sort_order = (stage ->> 'sort_order')::integer
      where id = (stage ->> 'id')::uuid and project_id = p_project
      returning id into saved_id;
      if saved_id is null then
        raise exception 'Tahapan tidak ditemukan';
      end if;
    else
      insert into public.project_stages (project_id, name, weight, sort_order)
      values (p_project, btrim(stage ->> 'name'), (stage ->> 'weight')::numeric, (stage ->> 'sort_order')::integer)
      returning id into saved_id;
    end if;
    kept := kept || saved_id;
    saved_id := null;
  end loop;

  delete from public.project_stages where project_id = p_project and id <> all (kept);

  perform public.check_progress_terms(p_project);
end;
$$;

revoke execute on function public.save_project_stages(uuid, jsonb) from public, anon;
grant execute on function public.save_project_stages(uuid, jsonb) to authenticated;

revoke execute on function public.check_progress_terms(uuid) from public, anon, authenticated;
revoke execute on function public.check_term_dates() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Seksi & progres L L L L — K K(P))
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['project_stages', 'project_sections', 'section_progress', 'progress_updates']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
    execute format(
      'create policy "Progress readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''marketing'', ''finance'', ''operations'')))', t);
  end loop;
end;
$$;

-- Operasional edits sections directly; stages and progress change only through
-- the functions above. kms is generated, so it is not granted.
grant insert (project_id, code, tower_from, tower_to, tower_count, length_km, circuits,
              planned_start, planned_finish, sort_order, notes) on table public.project_sections to authenticated;
grant update (code, tower_from, tower_to, tower_count, length_km, circuits,
              planned_start, planned_finish, sort_order, notes) on table public.project_sections to authenticated;
grant delete on table public.project_sections to authenticated;

create policy "Operasional adds sections" on public.project_sections
  for insert to authenticated
  with check ((select public.has_role('operations')));

create policy "Operasional edits sections" on public.project_sections
  for update to authenticated
  using ((select public.has_role('operations')))
  with check ((select public.has_role('operations')));

create policy "Operasional removes sections" on public.project_sections
  for delete to authenticated
  using ((select public.has_role('operations')));

revoke all on table public.section_progress_summary from anon;
revoke all on table public.project_progress from anon;
