-- Payroll: periods, generated payslips (PRD §11.7), adjustments, kasbon
-- installments, approval flow with attendance lock, payment, and wage cost
-- allocation into the single cost source. PRD PAY-01 … PAY-09, HCM-11, HCM-12
-- (change: add-payroll).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  period_start date not null,
  period_end date not null,
  group_kind text not null check (group_kind in ('field', 'office', 'all')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'returned', 'approved', 'paid', 'cancelled')),
  notes text,
  return_note text,
  generated_at timestamptz,
  submitted_at timestamptz,
  submitted_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  paid_at timestamptz,
  cancel_reason text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create trigger payroll_periods_set_updated_at
before update on public.payroll_periods
for each row execute function public.set_updated_at();

create trigger payroll_periods_audit
after insert or update on public.payroll_periods
for each row execute function public.audit_row_change('id');

create table public.payslips (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.payroll_periods (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete restrict,
  range_start date not null,
  range_end date not null,
  pay_type text not null check (pay_type in ('daily', 'monthly')),
  daily_wage numeric(14, 2) not null default 0,
  base_salary numeric(14, 2) not null default 0,
  fixed_allowance numeric(14, 2) not null default 0,
  meal_rate numeric(14, 2) not null default 0,
  field_rate numeric(14, 2) not null default 0,
  overtime_rate numeric(14, 2) not null default 0,
  active_days integer not null,
  period_days integer not null,
  recorded_days integer not null,
  present_days integer not null,
  project_days integer not null,
  absent_days integer not null,
  overtime_hours numeric(8, 1) not null default 0,
  wage_amount numeric(16, 2) not null default 0,
  base_amount numeric(16, 2) not null default 0,
  absence_deduction numeric(16, 2) not null default 0,
  meal_amount numeric(16, 2) not null default 0,
  field_amount numeric(16, 2) not null default 0,
  overtime_amount numeric(16, 2) not null default 0,
  incentive_amount numeric(16, 2) not null default 0,
  correction_amount numeric(16, 2) not null default 0,
  gross numeric(16, 2) not null default 0,
  bpjs_deduction numeric(16, 2) not null default 0,
  pph21_deduction numeric(16, 2) not null default 0,
  other_deduction numeric(16, 2) not null default 0,
  kasbon_deduction numeric(16, 2) not null default 0,
  total_deductions numeric(16, 2) not null default 0,
  net numeric(16, 2) not null default 0,
  incomplete_attendance boolean not null default false,
  unverified boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'paid')),
  paid_at date,
  payment_method text check (payment_method in ('transfer', 'cash')),
  created_at timestamptz not null default now(),
  unique (period_id, employee_id)
);

create index payslips_employee_idx on public.payslips (employee_id);

create table public.payslip_adjustments (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.payroll_periods (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete restrict,
  kind text not null check (kind in ('incentive', 'pph21', 'other_deduction', 'correction')),
  amount numeric(16, 2) not null,
  note text not null check (length(btrim(note)) > 0),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (kind = 'correction' or amount > 0),
  check (amount <> 0)
);

create index payslip_adjustments_idx on public.payslip_adjustments (period_id, employee_id);

create trigger payslip_adjustments_audit
after insert or update on public.payslip_adjustments
for each row execute function public.audit_row_change('id');

create table public.kasbon_installments (
  id uuid primary key default gen_random_uuid(),
  kasbon_id uuid not null references public.kasbons (id) on delete restrict,
  payslip_id uuid not null references public.payslips (id) on delete cascade,
  amount numeric(16, 2) not null check (amount > 0)
);

create index kasbon_installments_kasbon_idx on public.kasbon_installments (kasbon_id);

create table public.payroll_allocations (
  id uuid primary key default gen_random_uuid(),
  payslip_id uuid not null references public.payslips (id) on delete cascade,
  -- Null = Kantor/Umum (overhead).
  project_id uuid references public.projects (id) on delete restrict,
  days integer not null default 0,
  amount numeric(16, 2) not null
);

create index payroll_allocations_project_idx on public.payroll_allocations (project_id);

create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  work_date date not null,
  old_status text,
  new_status text not null,
  old_overtime numeric(4, 1) not null default 0,
  new_overtime numeric(4, 1) not null default 0,
  on_project boolean not null default false,
  reason text not null check (length(btrim(reason)) > 0),
  applied_period_id uuid references public.payroll_periods (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index attendance_corrections_employee_idx on public.attendance_corrections (employee_id, applied_period_id);

-- Salary data: audit entries for Direktur only (PRD §6).
create or replace function public.is_pay_table(p_table text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_table = any (array[
    'employee_pay_settings', 'kasbons', 'payslips', 'payslip_adjustments', 'kasbon_installments', 'payroll_allocations'
  ])
$$;

-- ---------------------------------------------------------------------------
-- HCM-11: attendance lock after approval
-- ---------------------------------------------------------------------------
create or replace function public.attendance_lock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_employee uuid := coalesce(new.employee_id, old.employee_id);
  v_date date := coalesce(new.work_date, old.work_date);
  v_type text;
begin
  if coalesce(current_setting('app.attendance_correction', true), '') = 'on' then
    return coalesce(new, old);
  end if;
  select work_type into v_type from public.employees where id = v_employee;
  -- Locked from submission: the slips Direktur approves and the cost split
  -- both use exactly the attendance the payroll was computed from. A returned
  -- period is open again until it is resubmitted.
  if exists (
    select 1 from public.payroll_periods p
    where p.status in ('submitted', 'approved', 'paid')
      and v_date between p.period_start and p.period_end
      and (p.group_kind = 'all' or p.group_kind = v_type)
  ) then
    raise exception 'Absensi periode ini sudah dikunci karena payroll sudah diajukan. Koreksi lewat HCM dengan alasan.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger attendance_lock
before insert or update or delete on public.attendance
for each row execute function public.attendance_lock();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.require_payroll_role(variadic p_roles public.app_role[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role(variadic p_roles) then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.require_payroll_role(public.app_role[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- PAY-01: period
-- p_values: { name, period_start, period_end, group_kind, notes }
-- ---------------------------------------------------------------------------
create or replace function public.create_payroll_period(p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start date := (p_values ->> 'period_start')::date;
  v_end date := (p_values ->> 'period_end')::date;
  v_group text := p_values ->> 'group_kind';
  v_id uuid;
begin
  perform public.require_payroll_role('hcm');
  if v_start is null or v_end is null or v_end < v_start then
    raise exception 'Tanggal periode tidak valid';
  end if;
  if v_group not in ('field', 'office', 'all') then
    raise exception 'Pilih kelompok periode';
  end if;
  if exists (
    select 1 from public.payroll_periods p
    where p.status <> 'cancelled'
      and daterange(p.period_start, p.period_end, '[]') && daterange(v_start, v_end, '[]')
      and (p.group_kind = 'all' or v_group = 'all' or p.group_kind = v_group)
  ) then
    raise exception 'Periode tumpang tindih dengan periode lain untuk karyawan yang sama';
  end if;
  insert into public.payroll_periods (name, period_start, period_end, group_kind, notes)
  values (btrim(p_values ->> 'name'), v_start, v_end, v_group, nullif(btrim(p_values ->> 'notes'), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- PAY-02, PAY-03, PAY-05: generate (and regenerate) the draft
-- ---------------------------------------------------------------------------
create or replace function public.generate_payroll(p_period uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period record;
  v_divisor numeric := coalesce((select monthly_salary_divisor from public.system_parameters limit 1), 26);
  e record;
  k record;
  c record;
  v_from date;
  v_to date;
  v_active integer;
  v_days integer;
  v_recorded integer;
  v_present integer;
  v_project_days integer;
  v_absent integer;
  v_overtime numeric;
  v_wage numeric;
  v_base numeric;
  v_absence numeric;
  v_meal numeric;
  v_field numeric;
  v_ot numeric;
  v_incentive numeric;
  v_correction numeric;
  v_gross numeric;
  v_bpjs numeric;
  v_pph numeric;
  v_other numeric;
  v_room numeric;
  v_kasbon numeric;
  v_take numeric;
  v_balance numeric;
  v_slip uuid;
  v_count integer := 0;
  v_dp integer;
  v_da integer;
  v_month_days integer;
begin
  perform public.require_payroll_role('hcm');
  select * into v_period from public.payroll_periods where id = p_period for update;
  if not found then
    raise exception 'Periode tidak ditemukan';
  end if;
  if v_period.status not in ('draft', 'returned') then
    raise exception 'Hanya periode Draft atau Dikembalikan yang dapat dihitung ulang';
  end if;

  delete from public.payslips where period_id = p_period;
  v_days := v_period.period_end - v_period.period_start + 1;
  v_month_days := extract(day from (date_trunc('month', v_period.period_start) + interval '1 month - 1 day'))::int;

  for e in
    select emp.id, emp.join_date, emp.exit_date, emp.verification_status,
           ps.pay_type, coalesce(ps.daily_wage, 0) as daily_wage, coalesce(ps.base_salary, 0) as base_salary,
           ps.fixed_allowance, ps.meal_allowance_per_day, ps.field_allowance_per_day, ps.overtime_rate_per_hour, ps.fixed_deduction
    from public.employees emp
    join public.employee_pay_settings ps on ps.employee_id = emp.id
    where (v_period.group_kind = 'all' or emp.work_type = v_period.group_kind)
      and emp.join_date <= v_period.period_end
      and (emp.exit_date is null or emp.exit_date >= v_period.period_start)
    order by emp.employee_no
  loop
    v_from := greatest(v_period.period_start, e.join_date);
    v_to := least(v_period.period_end, coalesce(e.exit_date, v_period.period_end));
    v_active := v_to - v_from + 1;

    select count(*)::int,
           count(*) filter (where status = 'present')::int,
           count(*) filter (where status = 'present' and project_id is not null)::int,
           count(*) filter (where status = 'absent')::int,
           coalesce(sum(overtime_hours), 0)
    into v_recorded, v_present, v_project_days, v_absent, v_overtime
    from public.attendance where employee_id = e.id and work_date between v_from and v_to;

    if e.pay_type = 'daily' then
      v_wage := e.daily_wage * v_present;
      v_base := 0;
      v_absence := 0;
    else
      v_wage := 0;
      -- Monthly pay accrues per calendar day of the month, so a full month pays
      -- in full and shorter periods (or mid-period join/exit) pay pro rata.
      v_base := round((e.base_salary + e.fixed_allowance) * least(v_active, v_month_days) / v_month_days, 0);
      v_absence := round(e.base_salary / v_divisor * v_absent, 0);
    end if;
    v_meal := e.meal_allowance_per_day * v_present;
    v_field := e.field_allowance_per_day * v_project_days;
    v_ot := round(e.overtime_rate_per_hour * v_overtime, 0);

    select coalesce(sum(amount) filter (where kind = 'incentive'), 0),
           coalesce(sum(amount) filter (where kind = 'correction'), 0),
           coalesce(sum(amount) filter (where kind = 'pph21'), 0),
           coalesce(sum(amount) filter (where kind = 'other_deduction'), 0)
    into v_incentive, v_correction, v_pph, v_other
    from public.payslip_adjustments where period_id = p_period and employee_id = e.id;

    -- HCM-11: unapplied corrections of earlier locked days.
    for c in
      select * from public.attendance_corrections
      where employee_id = e.id and applied_period_id is null and work_date < v_period.period_start
    loop
      v_dp := (c.new_status = 'present')::int - (coalesce(c.old_status, '') = 'present')::int;
      v_da := (c.new_status = 'absent')::int - (coalesce(c.old_status, '') = 'absent')::int;
      v_correction := v_correction
        + case when e.pay_type = 'daily' then v_dp * e.daily_wage else -round(v_da * e.base_salary / v_divisor, 0) end
        + v_dp * (e.meal_allowance_per_day + case when c.on_project then e.field_allowance_per_day else 0 end)
        + round((c.new_overtime - c.old_overtime) * e.overtime_rate_per_hour, 0);
    end loop;

    v_gross := v_wage + v_base - v_absence + v_meal + v_field + v_ot + v_incentive + v_correction;
    -- Fixed BPJS never takes net pay below zero (short periods, few present days).
    v_bpjs := least(e.fixed_deduction, greatest(v_gross - v_pph - v_other, 0));

    insert into public.payslips (
      period_id, employee_id, range_start, range_end, pay_type, daily_wage, base_salary, fixed_allowance, meal_rate,
      field_rate, overtime_rate, active_days, period_days, recorded_days, present_days, project_days, absent_days,
      overtime_hours, wage_amount, base_amount, absence_deduction, meal_amount, field_amount, overtime_amount,
      incentive_amount, correction_amount, gross, bpjs_deduction, pph21_deduction, other_deduction,
      incomplete_attendance, unverified
    ) values (
      p_period, e.id, v_from, v_to, e.pay_type, e.daily_wage, e.base_salary, e.fixed_allowance, e.meal_allowance_per_day,
      e.field_allowance_per_day, e.overtime_rate_per_hour, v_active, v_days, v_recorded, v_present, v_project_days, v_absent,
      v_overtime, v_wage, v_base, v_absence, v_meal, v_field, v_ot, v_incentive, v_correction, v_gross, v_bpjs, v_pph, v_other,
      v_recorded < v_active, e.verification_status = 'pending'
    )
    returning id into v_slip;

    -- Kasbon: min(installment, balance), reduced so net pay stays ≥ 0.
    v_room := greatest(v_gross - v_bpjs - v_pph - v_other, 0);
    v_kasbon := 0;
    for k in
      select kb.id, kb.installment_amount, kb.amount
      from public.kasbons kb
      where kb.employee_id = e.id and kb.status = 'active'
      order by kb.kasbon_date, kb.created_at
    loop
      select k.amount - coalesce(sum(i.amount), 0) into v_balance
      from public.kasbon_installments i
      join public.payslips s on s.id = i.payslip_id
      join public.payroll_periods p on p.id = s.period_id
      where i.kasbon_id = k.id and p.status <> 'cancelled' and p.id <> p_period;
      v_take := least(k.installment_amount, v_balance, v_room - v_kasbon);
      if v_take > 0 then
        insert into public.kasbon_installments (kasbon_id, payslip_id, amount) values (k.id, v_slip, v_take);
        v_kasbon := v_kasbon + v_take;
      end if;
    end loop;

    update public.payslips
    set kasbon_deduction = v_kasbon,
        total_deductions = v_bpjs + v_pph + v_other + v_kasbon,
        net = v_gross - (v_bpjs + v_pph + v_other + v_kasbon)
    where id = v_slip;
    v_count := v_count + 1;
  end loop;

  update public.payroll_periods set generated_at = now() where id = p_period;
  return v_count;
end;
$$;

-- p_values: { period_id, employee_id, kind, amount, note }
create or replace function public.save_payslip_adjustment(p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period uuid := (p_values ->> 'period_id')::uuid;
  v_status text;
  v_id uuid;
begin
  perform public.require_payroll_role('hcm');
  select status into v_status from public.payroll_periods where id = v_period;
  if v_status is null or v_status not in ('draft', 'returned') then
    raise exception 'Penyesuaian hanya untuk periode Draft atau Dikembalikan';
  end if;
  if length(btrim(coalesce(p_values ->> 'note', ''))) = 0 then
    raise exception 'Isi keterangan penyesuaian';
  end if;
  insert into public.payslip_adjustments (period_id, employee_id, kind, amount, note)
  values (v_period, (p_values ->> 'employee_id')::uuid, p_values ->> 'kind', (p_values ->> 'amount')::numeric,
          btrim(p_values ->> 'note'))
  returning id into v_id;
  perform public.generate_payroll(v_period);
  return v_id;
end;
$$;

create or replace function public.delete_payslip_adjustment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period uuid;
  v_status text;
begin
  perform public.require_payroll_role('hcm');
  select a.period_id, p.status into v_period, v_status
  from public.payslip_adjustments a join public.payroll_periods p on p.id = a.period_id where a.id = p_id;
  if v_status is null or v_status not in ('draft', 'returned') then
    raise exception 'Penyesuaian hanya dapat dihapus pada periode Draft atau Dikembalikan';
  end if;
  delete from public.payslip_adjustments where id = p_id;
  perform public.generate_payroll(v_period);
end;
$$;

-- ---------------------------------------------------------------------------
-- PAY-04: submit, return, approve (with allocation, PAY-08), cancel
-- ---------------------------------------------------------------------------
create or replace function public.submit_payroll(p_period uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period record;
begin
  perform public.require_payroll_role('hcm');
  select * into v_period from public.payroll_periods where id = p_period for update;
  if v_period.status not in ('draft', 'returned') then
    raise exception 'Hanya periode Draft atau Dikembalikan yang dapat diajukan';
  end if;
  -- Recompute from the attendance that is locked from this moment on.
  perform public.generate_payroll(p_period);
  if not exists (select 1 from public.payslips where period_id = p_period) then
    raise exception 'Hitung payroll dulu sebelum diajukan';
  end if;
  if exists (select 1 from public.payslips where period_id = p_period and net < 0) then
    raise exception 'Ada slip dengan gaji bersih negatif; periksa koreksi periode lalu dan potongan manual';
  end if;
  update public.payroll_periods set status = 'submitted', submitted_at = now(), submitted_by = auth.uid(), return_note = null
  where id = p_period;
  perform public.notify_roles(array['director']::public.app_role[], 'payroll', 'Payroll menunggu persetujuan',
    v_period.name, '/hr/payroll/' || p_period, 'payroll-submitted:' || p_period || ':' || extract(epoch from now())::bigint);
end;
$$;

create or replace function public.return_payroll(p_period uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period record;
begin
  perform public.require_payroll_role('director');
  if length(btrim(coalesce(p_note, ''))) = 0 then
    raise exception 'Isi catatan pengembalian';
  end if;
  select * into v_period from public.payroll_periods where id = p_period for update;
  if v_period.status <> 'submitted' then
    raise exception 'Hanya periode Diajukan yang dapat dikembalikan';
  end if;
  update public.payroll_periods set status = 'returned', return_note = btrim(p_note) where id = p_period;
  perform public.notify_roles(array['hcm']::public.app_role[], 'payroll', 'Payroll dikembalikan',
    format('%s · %s', v_period.name, btrim(p_note)), '/hr/payroll/' || p_period,
    'payroll-returned:' || p_period || ':' || extract(epoch from now())::bigint);
end;
$$;

create or replace function public.approve_payroll(p_period uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period record;
  v_names text;
  s record;
  v_project uuid;
  v_diff numeric;
begin
  perform public.require_payroll_role('director');
  select * into v_period from public.payroll_periods where id = p_period for update;
  if v_period.status <> 'submitted' then
    raise exception 'Hanya periode Diajukan yang dapat disetujui';
  end if;
  -- HCM-12: unverified local workers block approval.
  select string_agg(e.full_name, ', ') into v_names
  from public.payslips ps join public.employees e on e.id = ps.employee_id
  where ps.period_id = p_period and e.verification_status = 'pending';
  if v_names is not null then
    raise exception 'Slip belum dapat disetujui; pekerja belum diverifikasi HCM: %', v_names;
  end if;

  delete from public.payroll_allocations where payslip_id in (select id from public.payslips where period_id = p_period);
  for s in select * from public.payslips where period_id = p_period and gross <> 0
  loop
    if s.present_days > 0 then
      insert into public.payroll_allocations (payslip_id, project_id, days, amount)
      select s.id, a.project_id, count(*)::int, round(s.gross * count(*) / s.present_days, 0)
      from public.attendance a
      where a.employee_id = s.employee_id and a.work_date between s.range_start and s.range_end and a.status = 'present'
      group by a.project_id;
    else
      select a.project_id into v_project
      from public.assignments a
      where a.employee_id = s.employee_id and a.start_date <= s.range_end
        and (a.end_date is null or a.end_date >= s.range_start)
      order by a.start_date desc
      limit 1;
      insert into public.payroll_allocations (payslip_id, project_id, days, amount) values (s.id, v_project, 0, s.gross);
    end if;
    if s.present_days > 0 and (select coalesce(sum(days), 0) from public.payroll_allocations where payslip_id = s.id) <> s.present_days then
      raise exception 'Absensi % berubah sejak payroll dihitung; kembalikan ke HCM untuk dihitung ulang',
        (select full_name from public.employees where id = s.employee_id);
    end if;
    -- Rounding remainder on the largest share so the total equals gross.
    select s.gross - coalesce(sum(amount), 0) into v_diff from public.payroll_allocations where payslip_id = s.id;
    if v_diff <> 0 then
      update public.payroll_allocations set amount = amount + v_diff
      where id = (select id from public.payroll_allocations where payslip_id = s.id order by amount desc limit 1);
    end if;
  end loop;

  update public.attendance_corrections c set applied_period_id = p_period
  where c.applied_period_id is null and c.work_date < v_period.period_start
    and c.employee_id in (select employee_id from public.payslips where period_id = p_period);

  update public.payroll_periods set status = 'approved', approved_at = now(), approved_by = auth.uid() where id = p_period;
  perform public.notify_roles(array['finance']::public.app_role[], 'payroll', 'Payroll siap dibayar',
    v_period.name, '/hr/payroll/' || p_period, 'payroll-approved:' || p_period);
end;
$$;

create or replace function public.cancel_payroll_period(p_period uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_payroll_role('hcm');
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  update public.payroll_periods set status = 'cancelled', cancel_reason = btrim(p_reason)
  where id = p_period and status in ('draft', 'returned');
  if not found then
    raise exception 'Hanya periode Draft atau Dikembalikan yang dapat dibatalkan';
  end if;
  delete from public.payslips where period_id = p_period;
end;
$$;

-- PAY-06: p_slips null = every unpaid slip of the period.
create or replace function public.pay_payslips(p_period uuid, p_slips uuid[], p_date date, p_method text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_count integer;
begin
  perform public.require_payroll_role('finance');
  select status into v_status from public.payroll_periods where id = p_period for update;
  if v_status <> 'approved' then
    raise exception 'Hanya periode Disetujui yang dapat dibayar';
  end if;
  if p_method not in ('transfer', 'cash') then
    raise exception 'Pilih metode pembayaran';
  end if;
  if p_date is null or p_date > public.today_wib() then
    raise exception 'Tanggal pembayaran tidak valid';
  end if;
  update public.payslips set status = 'paid', paid_at = p_date, payment_method = p_method
  where period_id = p_period and status = 'draft' and (p_slips is null or id = any (p_slips));
  get diagnostics v_count = row_count;
  if not exists (select 1 from public.payslips where period_id = p_period and status = 'draft') then
    update public.payroll_periods set status = 'paid', paid_at = now() where id = p_period;
  end if;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- HCM-11: audited correction of a locked attendance day
-- ---------------------------------------------------------------------------
create or replace function public.correct_attendance(
  p_employee uuid,
  p_date date,
  p_status text,
  p_overtime numeric,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old record;
begin
  perform public.require_payroll_role('hcm');
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan koreksi';
  end if;
  if p_status not in ('present', 'permit', 'sick', 'leave', 'absent', 'off') then
    raise exception 'Status absensi tidak valid';
  end if;
  if p_status <> 'present' and coalesce(p_overtime, 0) <> 0 then
    raise exception 'Lembur hanya untuk status Hadir';
  end if;
  -- Days of a period still waiting for approval are fixed by returning it, not
  -- by a correction (it would be paid twice once the period is recomputed).
  if exists (
    select 1 from public.payroll_periods p join public.employees e on e.id = p_employee
    where p.status = 'submitted' and p_date between p.period_start and p.period_end
      and (p.group_kind = 'all' or p.group_kind = e.work_type)
  ) then
    raise exception 'Periode ini masih diajukan; minta Direktur mengembalikan payroll, lalu ubah absensi seperti biasa';
  end if;
  select status, overtime_hours, project_id into v_old from public.attendance where employee_id = p_employee and work_date = p_date;

  perform set_config('app.attendance_correction', 'on', true);
  if found then
    update public.attendance set status = p_status, overtime_hours = coalesce(p_overtime, 0), recorded_by = auth.uid()
    where employee_id = p_employee and work_date = p_date;
  else
    insert into public.attendance (employee_id, work_date, status, overtime_hours, recorded_by)
    values (p_employee, p_date, p_status, coalesce(p_overtime, 0), auth.uid());
  end if;
  perform set_config('app.attendance_correction', 'off', true);

  insert into public.attendance_corrections (employee_id, work_date, old_status, new_status, old_overtime, new_overtime, on_project, reason)
  values (p_employee, p_date, v_old.status, p_status, coalesce(v_old.overtime_hours, 0), coalesce(p_overtime, 0),
          v_old.project_id is not null, btrim(p_reason));
  perform public.log_audit_event('attendance', p_employee::text || ':' || p_date::text, 'update', btrim(p_reason),
    jsonb_build_object('status', format('%s → %s', coalesce(v_old.status, '—'), p_status),
                       'overtime_hours', format('%s → %s', coalesce(v_old.overtime_hours, 0), coalesce(p_overtime, 0))));
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.create_payroll_period(jsonb)',
    'public.generate_payroll(uuid)',
    'public.save_payslip_adjustment(jsonb)',
    'public.delete_payslip_adjustment(uuid)',
    'public.submit_payroll(uuid)',
    'public.return_payroll(uuid, text)',
    'public.approve_payroll(uuid)',
    'public.cancel_payroll_period(uuid, text)',
    'public.pay_payslips(uuid, uuid[], date, text)',
    'public.correct_attendance(uuid, date, text, numeric, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Kasbon cannot be cancelled once deducted; balance counts approved periods
-- ---------------------------------------------------------------------------
create or replace function public.cancel_kasbon(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role('finance', 'hcm') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  if exists (
    select 1 from public.kasbon_installments i join public.payslips s on s.id = i.payslip_id
    join public.payroll_periods p on p.id = s.period_id
    where i.kasbon_id = p_id and p.status <> 'cancelled'
  ) then
    raise exception 'Kasbon yang sudah masuk payroll tidak dapat dibatalkan';
  end if;
  update public.kasbons set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now()
  where id = p_id and status = 'active';
  if not found then
    raise exception 'Kasbon tidak ditemukan atau sudah batal';
  end if;
end;
$$;

create or replace view public.kasbon_balances
with (security_invoker = true)
as
select
  k.id, k.employee_id, e.employee_no, e.full_name, k.kasbon_date, k.amount, k.installment_amount, k.description,
  k.source, k.field_cash_expense_id, k.status, k.cancel_reason, k.created_at,
  coalesce(d.deducted, 0)::numeric as deducted,
  case when k.status = 'active' then greatest(k.amount - coalesce(d.deducted, 0), 0) else 0 end as balance
from public.kasbons k
join public.employees e on e.id = k.employee_id
left join lateral (
  select sum(i.amount) as deducted
  from public.kasbon_installments i
  join public.payslips s on s.id = i.payslip_id
  join public.payroll_periods p on p.id = s.period_id
  where i.kasbon_id = k.id and p.status in ('approved', 'paid')
) d on true;

-- ---------------------------------------------------------------------------
-- PAY-08: payroll in the single cost source (aggregate, no employee data)
-- ---------------------------------------------------------------------------
create view public.payroll_cost_entries
as
select
  'payroll'::text as source,
  a.id as source_id,
  p.period_end as entry_date,
  a.project_id,
  (select id from public.cost_categories where code = 'WAGES') as cost_category_id,
  a.amount,
  'Gaji ' || p.name as description,
  'Payroll' as reference,
  s.status = 'paid' as paid
from public.payroll_allocations a
join public.payslips s on s.id = a.payslip_id
join public.payroll_periods p on p.id = s.period_id
where p.status in ('approved', 'paid')
  and (select public.has_role('super_admin', 'director', 'finance', 'operations', 'hcm'));

revoke all on table public.payroll_cost_entries from anon;
grant select on table public.payroll_cost_entries to authenticated;

create or replace view public.cost_entries
with (security_invoker = true)
as
select
  'supplier_bill'::text as source,
  b.id as source_id,
  b.bill_date as entry_date,
  l.project_id,
  l.cost_category_id,
  l.amount + case
    when not b.ppn_is_cost or b.subtotal = 0 then 0
    else round(b.ppn_amount * l.amount / b.subtotal, 0)
  end as amount,
  l.description,
  s.name || ' · ' || b.bill_no as reference
from public.supplier_bill_lines l
join public.supplier_bills b on b.id = l.bill_id
join public.suppliers s on s.id = b.supplier_id
where b.status <> 'cancelled' and not b.is_opening
union all
select 'expense', e.id, e.expense_date, e.project_id, e.cost_category_id, e.amount, e.description,
       case when e.is_opening then 'Saldo awal biaya' else coalesce(e.payee, 'Pengeluaran langsung') end
from public.expenses e
where e.status = 'active'
union all
select 'field_cash', f.id, f.expense_date, f.project_id, f.cost_category_id, f.amount, f.description, 'Kas lapangan'
from public.field_cash_expenses f
where f.status = 'approved' and f.kind = 'project_cost'
union all
select pc.source, pc.source_id, pc.entry_date, pc.project_id, pc.cost_category_id, pc.amount, pc.description, pc.reference
from public.payroll_cost_entries pc;

-- Cash out of a project now includes paid payroll allocations (§11.3 Posisi Kas),
-- in its own column; the view is recreated because its columns change.
drop view public.project_financials;

create view public.project_financials
as
with params as (
  select coalesce(health_warning_points, 10) as warn, coalesce(health_critical_points, 20) as crit
  from public.system_parameters limit 1
),
base as (
  select
    o.id as project_id,
    o.code,
    o.name,
    o.status,
    o.client_name,
    o.start_date,
    coalesce(o.contract_value, 0) as contract_value,
    coalesce(o.progress, 0) as progress,
    coalesce(o.planned_progress, 0) as planned_progress,
    coalesce((select sum(b.amount) from public.project_budgets b where b.project_id = o.id), 0) as total_budget,
    coalesce((select sum(e.amount) from public.cost_entries e where e.project_id = o.id), 0) as cost,
    coalesce((select sum(x.final_estimate) from public.project_cost_by_category x where x.project_id = o.id), 0) as final_cost,
    coalesce((select sum(i.dpp) from public.invoices i
              where i.project_id = o.id and i.status in ('issued', 'partial', 'paid')), 0) as revenue,
    coalesce((select sum(i.total) from public.invoices i
              where i.project_id = o.id and i.status in ('issued', 'partial', 'paid')), 0) as billed_total,
    coalesce((select sum(p.amount_received + p.pph_amount) from public.invoice_payments p
              join public.invoices i on i.id = p.invoice_id
              where i.project_id = o.id and p.status = 'active'), 0) as received_total,
    coalesce((select sum(p.amount_received) from public.invoice_payments p
              join public.invoices i on i.id = p.invoice_id
              where i.project_id = o.id and p.status = 'active' and not p.is_opening), 0) as cash_in,
    coalesce((select round(sum(sp.amount * l.amount / nullif(b.subtotal, 0)), 0)
              from public.supplier_payments sp
              join public.supplier_bills b on b.id = sp.bill_id
              join public.supplier_bill_lines l on l.bill_id = b.id
              where l.project_id = o.id and sp.status = 'active' and not sp.is_opening), 0) as supplier_paid,
    coalesce((select sum(pc.amount) from public.payroll_cost_entries pc where pc.project_id = o.id and pc.paid), 0)
      as payroll_paid,
    coalesce((select sum(e.amount) from public.expenses e
              where e.project_id = o.id and e.status = 'active' and not e.is_opening), 0) as expenses_paid,
    coalesce((select sum(case when m.kind = 'topup' then m.amount else -m.amount end) from public.field_cash_movements m
              where m.project_id = o.id and m.status = 'active'), 0) as net_topups,
    coalesce((select f.balance from public.field_cash_balances f where f.project_id = o.id), 0) as field_cash_balance
  from public.project_overview o
)
select
  b.*,
  round(b.contract_value * b.progress / 100, 0) as work_done,
  round(b.contract_value * b.progress / 100, 0) - b.revenue as unbilled,
  b.revenue - b.cost as gross_profit,
  case when b.revenue > 0 then round((b.revenue - b.cost) / b.revenue * 100, 2) end as margin,
  b.contract_value - b.total_budget as planned_profit,
  b.contract_value - b.final_cost as projected_profit,
  b.supplier_paid + b.payroll_paid + b.expenses_paid + b.net_topups as cash_out,
  b.cash_in - (b.supplier_paid + b.payroll_paid + b.expenses_paid + b.net_topups) as cash_position,
  case when b.total_budget > 0 then round(b.cost / b.total_budget * 100, 2) end as cost_used_pct,
  case when b.total_budget > 0 then round(b.cost / b.total_budget * 100 - b.progress, 2) end as cost_index,
  round(b.progress - b.planned_progress, 2) as schedule_deviation,
  case
    when (b.total_budget > 0 and (b.cost / b.total_budget * 100 - b.progress > p.crit or b.cost > b.total_budget))
         or b.progress - b.planned_progress < -p.crit then 'critical'
    when (b.total_budget > 0 and b.cost / b.total_budget * 100 - b.progress > p.warn)
         or b.progress - b.planned_progress < -p.warn then 'warning'
    else 'normal'
  end as health
from base b
cross join params p
where (select public.has_role('super_admin', 'director', 'finance', 'operations'));

revoke all on table public.project_financials from anon;
grant select on table public.project_financials to authenticated;

create or replace function public.company_monthly_summary(p_year integer)
returns table (
  month date,
  revenue numeric,
  project_cost numeric,
  overhead numeric,
  profit numeric,
  cash_in numeric,
  cash_out numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role('super_admin', 'director', 'finance', 'operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  return query
  with months as (
    select make_date(p_year, m, 1) as month from generate_series(1, 12) m
  )
  select
    m.month,
    coalesce((select sum(i.dpp) from public.invoices i
              where i.status in ('issued', 'partial', 'paid') and date_trunc('month', i.invoice_date) = m.month), 0),
    coalesce((select sum(e.amount) from public.cost_entries e
              where e.project_id is not null and date_trunc('month', e.entry_date) = m.month), 0),
    coalesce((select sum(e.amount) from public.cost_entries e
              where e.project_id is null and date_trunc('month', e.entry_date) = m.month), 0),
    coalesce((select sum(i.dpp) from public.invoices i
              where i.status in ('issued', 'partial', 'paid') and date_trunc('month', i.invoice_date) = m.month), 0)
      - coalesce((select sum(e.amount) from public.cost_entries e where date_trunc('month', e.entry_date) = m.month), 0),
    coalesce((select sum(p.amount_received) from public.invoice_payments p
              where p.status = 'active' and not p.is_opening and date_trunc('month', p.payment_date) = m.month), 0),
    coalesce((select sum(sp.amount) from public.supplier_payments sp
              where sp.status = 'active' and not sp.is_opening and date_trunc('month', sp.payment_date) = m.month), 0)
      + coalesce((select sum(e.amount) from public.expenses e
                  where e.status = 'active' and not e.is_opening and date_trunc('month', e.expense_date) = m.month), 0)
      + coalesce((select sum(case when f.kind = 'topup' then f.amount else -f.amount end) from public.field_cash_movements f
                  where f.status = 'active' and date_trunc('month', f.movement_date) = m.month), 0)
      + coalesce((select sum(s.net) from public.payslips s
                  where s.status = 'paid' and date_trunc('month', s.paid_at) = m.month), 0)
  from months m
  order by m.month;
end;
$$;

-- ---------------------------------------------------------------------------
-- Views for the pages
-- ---------------------------------------------------------------------------
create view public.payslip_list
with (security_invoker = true)
as
select
  s.*,
  e.employee_no,
  e.full_name,
  e.work_type,
  e.bank_name,
  e.bank_account_number,
  e.bank_account_holder,
  pos.name as position_name,
  (select string_agg(distinct coalesce(pr.code, 'Kantor/Umum'), ', ')
   from public.attendance a left join public.projects pr on pr.id = a.project_id
   where a.employee_id = s.employee_id and a.work_date between s.range_start and s.range_end and a.status = 'present') as projects,
  (select pr.id from public.attendance a join public.projects pr on pr.id = a.project_id
   where a.employee_id = s.employee_id and a.work_date between s.range_start and s.range_end and a.status = 'present'
   group by pr.id order by count(*) desc limit 1) as main_project_id
from public.payslips s
join public.employees e on e.id = s.employee_id
left join public.positions pos on pos.id = e.position_id;

-- PAY-01 list: one row per period with its slip totals.
create view public.payroll_period_list
with (security_invoker = true)
as
select
  p.id, p.name, p.period_start, p.period_end, p.group_kind, p.status, p.notes, p.return_note,
  p.generated_at, p.approved_at, p.paid_at,
  count(s.id)::int as slip_count,
  coalesce(sum(s.gross), 0) as gross_total,
  coalesce(sum(s.net), 0) as net_total,
  (count(s.id) filter (where s.incomplete_attendance or s.unverified))::int as flagged
from public.payroll_periods p
left join public.payslips s on s.period_id = p.id
group by p.id;

-- PAY-09: per period × project (null = Kantor/Umum).
create view public.payroll_recap
with (security_invoker = true)
as
select
  s.period_id,
  a.project_id,
  coalesce(pr.code, 'Kantor/Umum') as project_code,
  count(distinct s.employee_id)::int as employees,
  sum(a.days)::int as days,
  sum(a.amount) as allocated
from public.payroll_allocations a
join public.payslips s on s.id = a.payslip_id
left join public.projects pr on pr.id = a.project_id
group by s.period_id, a.project_id, pr.code;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: pengaturan gaji, kasbon, payroll — S(Dir) K(Fin) K(HCM))
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'payroll_periods', 'payslips', 'payslip_adjustments', 'kasbon_installments', 'payroll_allocations', 'attendance_corrections'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
    execute format(
      'create policy "Payroll readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''finance'', ''hcm'', ''director'')))', t);
  end loop;
end;
$$;

revoke all on table public.payslip_list from anon;
revoke all on table public.payroll_period_list from anon;
revoke all on table public.payroll_recap from anon;
