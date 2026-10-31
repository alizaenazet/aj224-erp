-- fix-hcm-gaps: HCM defects found while checking v1 against the PRD.

-- ---------------------------------------------------------------------------
-- HCM-01, HCM-05: an employee who has left holds no assignment past the exit
-- date, and an end date cannot be extended past it or on a finished project.
-- ---------------------------------------------------------------------------
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
      -- Shortening is always allowed (leaving ends assignments this way);
      -- extending or re-opening needs an employee and a project still there.
      if coalesce(new.end_date, 'infinity'::date) > coalesce(old.end_date, 'infinity'::date) then
        select full_name, exit_date into employee
        from public.employees
        where id = new.employee_id
        for update;
        if employee.exit_date is not null and coalesce(new.end_date, 'infinity'::date) > employee.exit_date then
          raise exception '% sudah keluar pada %; tanggal selesai paling lambat tanggal itu',
            employee.full_name, public.format_date_id(employee.exit_date);
        end if;
        select code, status into project from public.projects where id = new.project_id;
        if project.status in ('completed', 'closed') then
          raise exception 'Proyek % sudah selesai atau ditutup', project.code;
        end if;
      end if;

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
  if employee.exit_date is not null and coalesce(new.end_date, 'infinity'::date) > employee.exit_date then
    raise exception '% keluar pada %; isi tanggal selesai paling lambat tanggal itu',
      employee.full_name, public.format_date_id(employee.exit_date);
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

-- ---------------------------------------------------------------------------
-- HCM-04: Operasional is also reminded when the employee is on an active
-- assignment (the follow-up noted in add-certifications-training).
-- ---------------------------------------------------------------------------
create or replace function public.check_certificate_expiry()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cert record;
  project_code text;
  title text;
  body text;
begin
  for cert in
    select id, employee_id, employee_name, certificate_type_name, expiry_date, status
    from public.employee_certificate_list
    where is_current
      and employee_active
      and status in ('expiring', 'expired')
  loop
    title := case cert.status when 'expiring' then 'Sertifikat segera kedaluwarsa' else 'Sertifikat kedaluwarsa' end;
    body := format('%s · %s berakhir %s.', cert.employee_name, cert.certificate_type_name,
                   public.format_date_id(cert.expiry_date));

    perform public.notify_roles(
      array['hcm']::public.app_role[],
      'certificate',
      title,
      body,
      '/hr/certificates?status=' || cert.status,
      'cert-' || cert.status || ':' || cert.id
    );

    select p.code into project_code
    from public.assignments a
    join public.projects p on p.id = a.project_id
    where a.employee_id = cert.employee_id
      and a.start_date <= public.today_wib()
      and (a.end_date is null or a.end_date >= public.today_wib())
    limit 1;
    if found then
      perform public.notify_roles(
        array['operations']::public.app_role[],
        'certificate',
        title,
        format('%s · %s berakhir %s · bertugas di %s.', cert.employee_name, cert.certificate_type_name,
               public.format_date_id(cert.expiry_date), project_code),
        '/hr/certificates?status=' || cert.status,
        'cert-' || cert.status || '-crew:' || cert.id
      );
    end if;
  end loop;
end;
$$;

revoke execute on function public.check_certificate_expiry() from public, anon, authenticated;

update public.scheduled_checks
set description = 'Pengingat sertifikat segera kedaluwarsa dan kedaluwarsa ke HCM, dan ke Operasional bila karyawan sedang bertugas (HCM-04)'
where name = 'certificate-expiry';

-- ---------------------------------------------------------------------------
-- HCM-07: certificates issued by a training follow later edits of it.
-- ---------------------------------------------------------------------------
create or replace function public.trainings_sync_certificates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  issued date := coalesce(new.end_date, new.start_date);
  validity integer;
begin
  if new.certificate_type_id is distinct from old.certificate_type_id
     and exists (select 1 from public.employee_certificates c where c.training_id = new.id) then
    raise exception 'Jenis sertifikat tidak dapat diubah karena sertifikat dari pelatihan ini sudah terbit. Ubah dulu hasil peserta yang Lulus.';
  end if;
  if new.certificate_type_id is null then
    return null;
  end if;

  select validity_months into validity from public.certificate_types where id = new.certificate_type_id;

  update public.employee_certificates c
  set issuer = new.organizer,
      issued_date = issued,
      expiry_date = case when validity is null then null else (issued + make_interval(months => validity))::date end
  where c.training_id = new.id
    and (c.issuer is distinct from new.organizer or c.issued_date is distinct from issued);

  -- Participants who passed while the training had no certificate type.
  with created as (
    insert into public.employee_certificates
      (employee_id, certificate_type_id, issuer, issued_date, expiry_date, training_id)
    select
      p.employee_id,
      new.certificate_type_id,
      new.organizer,
      issued,
      case when validity is null then null else (issued + make_interval(months => validity))::date end,
      new.id
    from public.training_participants p
    where p.training_id = new.id
      and p.result = 'passed'
      and p.certificate_id is null
    returning id, employee_id
  )
  update public.training_participants p
  set certificate_id = created.id
  from created
  where p.training_id = new.id
    and p.employee_id = created.employee_id;

  return null;
end;
$$;

create trigger trainings_sync_certificates
after update of certificate_type_id, organizer, start_date, end_date on public.trainings
for each row execute function public.trainings_sync_certificates();
