-- Receivables: invoices from termin and other work, incoming payments with PPh
-- withholding, receivables list, aging, daily reminders and opening balances.
-- PRD FIN-01 … FIN-05, PRJ-03 (change: add-receivables).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  project_id uuid not null references public.projects (id) on delete restrict,
  term_id uuid references public.project_terms (id) on delete restrict,
  kind text not null check (kind in ('term', 'other', 'opening')),
  description text not null check (length(btrim(description)) > 0),
  invoice_date date not null,
  due_date date not null,
  gross_amount numeric(16, 2) not null check (gross_amount >= 0),
  dp_deduction numeric(16, 2) not null default 0 check (dp_deduction >= 0),
  retention_deduction numeric(16, 2) not null default 0 check (retention_deduction >= 0),
  other_deduction numeric(16, 2) not null default 0 check (other_deduction >= 0),
  other_deduction_note text,
  dpp numeric(16, 2) not null check (dpp >= 0),
  ppn_rate numeric(5, 2) not null default 0 check (ppn_rate between 0 and 100),
  ppn_amount numeric(16, 2) not null default 0 check (ppn_amount >= 0),
  total numeric(16, 2) not null check (total >= 0),
  status text not null default 'draft' check (status in ('draft', 'issued', 'partial', 'paid', 'cancelled')),
  notes text,
  issued_at timestamptz,
  issued_by uuid references public.profiles (id) on delete set null,
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (dpp = gross_amount - dp_deduction - retention_deduction - other_deduction),
  check (total = dpp + ppn_amount),
  check (due_date >= invoice_date),
  check ((kind = 'term') = (term_id is not null)),
  check (status = 'draft' or status = 'cancelled' or number is not null)
);

create unique index invoices_term_active_key on public.invoices (term_id) where term_id is not null and status <> 'cancelled';
create index invoices_project_idx on public.invoices (project_id, invoice_date desc);

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create trigger invoices_audit
after insert or update on public.invoices
for each row execute function public.audit_row_change('id');

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  payment_date date not null,
  amount_received numeric(16, 2) not null default 0 check (amount_received >= 0),
  pph_amount numeric(16, 2) not null default 0 check (pph_amount >= 0),
  pph_slip_no text,
  bank_account_id uuid references public.company_bank_accounts (id) on delete restrict,
  notes text,
  is_opening boolean not null default false,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (amount_received + pph_amount > 0)
);

create index invoice_payments_invoice_idx on public.invoice_payments (invoice_id, payment_date);

create trigger invoice_payments_audit
after insert or update on public.invoice_payments
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- Internal: status of an invoice and its termin from active payments
-- ---------------------------------------------------------------------------
create or replace function public.invoice_refresh(p_invoice uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice record;
  v_settled numeric;
  v_status text;
begin
  select id, status, total, term_id into v_invoice from public.invoices where id = p_invoice for update;
  if v_invoice.status in ('draft', 'cancelled') then
    return;
  end if;
  select coalesce(sum(amount_received + pph_amount), 0) into v_settled
  from public.invoice_payments where invoice_id = p_invoice and status = 'active';
  v_status := case when v_settled >= v_invoice.total then 'paid' when v_settled > 0 then 'partial' else 'issued' end;
  if v_status <> v_invoice.status then
    update public.invoices set status = v_status where id = p_invoice;
  end if;
  if v_invoice.term_id is not null then
    update public.project_terms
    set status = case when v_status = 'paid' then 'paid' else 'invoiced' end
    where id = v_invoice.term_id and status in ('ready', 'invoiced', 'paid');
  end if;
end;
$$;

revoke execute on function public.invoice_refresh(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Functions (FIN-01 … FIN-03)
-- p_values: { project_id, term_id, kind term|other, description, invoice_date,
--   due_date, gross_amount, dp_deduction, retention_deduction, other_deduction,
--   other_deduction_note, notes }
-- ---------------------------------------------------------------------------
create or replace function public.save_invoice(p_id uuid, p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text := coalesce(p_values ->> 'kind', 'other');
  v_term uuid := nullif(p_values ->> 'term_id', '')::uuid;
  v_project uuid := (p_values ->> 'project_id')::uuid;
  v_date date := coalesce((p_values ->> 'invoice_date')::date, public.today_wib());
  v_due date := (p_values ->> 'due_date')::date;
  v_gross numeric := (p_values ->> 'gross_amount')::numeric;
  v_dp numeric := coalesce((p_values ->> 'dp_deduction')::numeric, 0);
  v_ret numeric := coalesce((p_values ->> 'retention_deduction')::numeric, 0);
  v_other numeric := coalesce((p_values ->> 'other_deduction')::numeric, 0);
  v_dpp numeric;
  v_rate numeric;
  v_ppn numeric;
  v_term_row record;
  v_term_name text;
  v_existing record;
  v_id uuid := p_id;
begin
  if not public.has_role('finance') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if v_kind not in ('term', 'other') then
    raise exception 'Jenis invoice tidak valid';
  end if;
  if p_id is not null then
    select id, status, kind, term_id into v_existing from public.invoices where id = p_id for update;
    if not found then
      raise exception 'Invoice tidak ditemukan';
    end if;
    if v_existing.status <> 'draft' then
      raise exception 'Hanya invoice Draft yang dapat diubah';
    end if;
    v_kind := v_existing.kind;
    v_term := v_existing.term_id;
  end if;

  if v_kind = 'term' then
    select t.id, t.project_id, t.status, t.amount_value, t.name into v_term_row
    from public.project_term_list t where t.id = v_term;
    if not found then
      raise exception 'Termin tidak ditemukan';
    end if;
    if p_id is null and v_term_row.status <> 'ready' then
      raise exception 'Invoice termin hanya dibuat dari termin berstatus Siap Ditagih';
    end if;
    v_project := v_term_row.project_id;
    v_term_name := v_term_row.name;
    v_gross := coalesce(v_gross, v_term_row.amount_value);
  else
    v_term := null;
  end if;

  if v_project is null or not exists (select 1 from public.projects where id = v_project) then
    raise exception 'Proyek tidak valid';
  end if;
  if v_gross is null or v_gross < 0 then
    raise exception 'Nilai bruto tidak valid';
  end if;
  v_dpp := v_gross - v_dp - v_ret - v_other;
  if v_dpp < 0 then
    raise exception 'Potongan melebihi nilai bruto';
  end if;
  if v_other > 0 and length(btrim(coalesce(p_values ->> 'other_deduction_note', ''))) = 0 then
    raise exception 'Isi keterangan potongan lain';
  end if;

  -- PPN only when the company is PKP and the contract is subject to PPN.
  select case when cp.is_pkp and coalesce(pc.ppn_applicable, false)
              then coalesce((select ppn_rate from public.system_parameters limit 1), 11) else 0 end
  into v_rate
  from public.company_profile cp
  left join public.project_contracts pc on pc.project_id = v_project;
  v_rate := coalesce(v_rate, 0);
  v_ppn := round(v_dpp * v_rate / 100, 0);

  if v_due is null then
    v_due := v_date + coalesce((
      select c.payment_term_days from public.projects p join public.clients c on c.id = p.client_id where p.id = v_project
    ), 30);
  end if;
  if v_due < v_date then
    raise exception 'Jatuh tempo tidak boleh sebelum tanggal invoice';
  end if;

  if p_id is null then
    insert into public.invoices (
      project_id, term_id, kind, description, invoice_date, due_date, gross_amount, dp_deduction,
      retention_deduction, other_deduction, other_deduction_note, dpp, ppn_rate, ppn_amount, total, notes
    ) values (
      v_project, v_term, v_kind,
      coalesce(nullif(btrim(p_values ->> 'description'), ''), v_term_name, 'Invoice'),
      v_date, v_due, v_gross, v_dp, v_ret, v_other, nullif(btrim(p_values ->> 'other_deduction_note'), ''),
      v_dpp, v_rate, v_ppn, v_dpp + v_ppn, nullif(btrim(p_values ->> 'notes'), '')
    )
    returning id into v_id;
  else
    update public.invoices
    set project_id = v_project,
        description = coalesce(nullif(btrim(p_values ->> 'description'), ''), description),
        invoice_date = v_date,
        due_date = v_due,
        gross_amount = v_gross,
        dp_deduction = v_dp,
        retention_deduction = v_ret,
        other_deduction = v_other,
        other_deduction_note = nullif(btrim(p_values ->> 'other_deduction_note'), ''),
        dpp = v_dpp,
        ppn_rate = v_rate,
        ppn_amount = v_ppn,
        total = v_dpp + v_ppn,
        notes = nullif(btrim(p_values ->> 'notes'), '')
    where id = p_id;
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'Termin ini sudah memiliki invoice yang belum dibatalkan';
end;
$$;

create or replace function public.issue_invoice(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice record;
  v_number text;
begin
  if not public.has_role('finance') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select id, status, invoice_date, term_id into v_invoice from public.invoices where id = p_id for update;
  if not found then
    raise exception 'Invoice tidak ditemukan';
  end if;
  if v_invoice.status <> 'draft' then
    raise exception 'Hanya invoice Draft yang dapat diterbitkan';
  end if;
  v_number := public.next_document_number('invoice', v_invoice.invoice_date);
  update public.invoices
  set number = v_number, status = 'issued', issued_at = now(), issued_by = auth.uid()
  where id = p_id;
  perform public.invoice_refresh(p_id);
  return v_number;
end;
$$;

-- p_values: { payment_date, amount_received, pph_amount, pph_slip_no, bank_account_id, notes }
create or replace function public.record_invoice_payment(p_invoice uuid, p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice record;
  v_received numeric := coalesce((p_values ->> 'amount_received')::numeric, 0);
  v_pph numeric := coalesce((p_values ->> 'pph_amount')::numeric, 0);
  v_settled numeric;
  v_date date := coalesce((p_values ->> 'payment_date')::date, public.today_wib());
  v_id uuid;
begin
  if not public.has_role('finance') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select id, status, total, invoice_date into v_invoice from public.invoices where id = p_invoice for update;
  if not found then
    raise exception 'Invoice tidak ditemukan';
  end if;
  if v_invoice.status not in ('issued', 'partial') then
    raise exception 'Pembayaran hanya untuk invoice Terbit atau Dibayar Sebagian';
  end if;
  if v_received < 0 or v_pph < 0 or v_received + v_pph <= 0 then
    raise exception 'Isi jumlah diterima atau potongan PPh';
  end if;
  if v_date > public.today_wib() then
    raise exception 'Tanggal pembayaran tidak boleh melewati hari ini';
  end if;
  if v_pph > 0 and length(btrim(coalesce(p_values ->> 'pph_slip_no', ''))) = 0 then
    raise exception 'Isi nomor bukti potong PPh';
  end if;
  select coalesce(sum(amount_received + pph_amount), 0) into v_settled
  from public.invoice_payments where invoice_id = p_invoice and status = 'active';
  if v_settled + v_received + v_pph > v_invoice.total then
    raise exception 'Pembayaran melebihi sisa tagihan (Rp %)',
      replace(to_char(v_invoice.total - v_settled, 'FM999,999,999,999,990'), ',', '.');
  end if;

  insert into public.invoice_payments (
    invoice_id, payment_date, amount_received, pph_amount, pph_slip_no, bank_account_id, notes
  ) values (
    p_invoice, v_date, v_received, v_pph, nullif(btrim(p_values ->> 'pph_slip_no'), ''),
    nullif(p_values ->> 'bank_account_id', '')::uuid, nullif(btrim(p_values ->> 'notes'), '')
  )
  returning id into v_id;
  perform public.invoice_refresh(p_invoice);
  return v_id;
end;
$$;

create or replace function public.cancel_invoice_payment(p_payment uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
begin
  if not public.has_role('finance') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  select id, invoice_id, status into v_payment from public.invoice_payments where id = p_payment for update;
  if not found or v_payment.status <> 'active' then
    raise exception 'Pembayaran tidak ditemukan atau sudah dibatalkan';
  end if;
  update public.invoice_payments set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now()
  where id = p_payment;
  perform public.invoice_refresh(v_payment.invoice_id);
end;
$$;

create or replace function public.cancel_invoice(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice record;
begin
  if not public.has_role('finance') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  select id, status, term_id into v_invoice from public.invoices where id = p_id for update;
  if not found then
    raise exception 'Invoice tidak ditemukan';
  end if;
  if v_invoice.status = 'cancelled' then
    raise exception 'Invoice sudah dibatalkan';
  end if;
  if exists (select 1 from public.invoice_payments where invoice_id = p_id and status = 'active') then
    raise exception 'Batalkan dulu pembayaran yang tercatat pada invoice ini';
  end if;
  update public.invoices set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now() where id = p_id;
  if v_invoice.term_id is not null then
    update public.project_terms set status = 'ready' where id = v_invoice.term_id and status in ('invoiced', 'paid');
  end if;
end;
$$;

-- UMM-13: an invoice from before cut-off with its original number.
-- p_values: { project_id, number, invoice_date, due_date, description, dpp, ppn_amount, received }
create or replace function public.import_opening_invoice(p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dpp numeric := (p_values ->> 'dpp')::numeric;
  v_ppn numeric := coalesce((p_values ->> 'ppn_amount')::numeric, 0);
  v_received numeric := coalesce((p_values ->> 'received')::numeric, 0);
  v_date date := (p_values ->> 'invoice_date')::date;
  v_id uuid;
begin
  if not public.has_role('finance') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if v_dpp is null or v_dpp < 0 or v_ppn < 0 or v_received < 0 then
    raise exception 'Nilai tidak valid';
  end if;
  if v_ppn > v_dpp then
    raise exception 'PPN tidak boleh melebihi DPP';
  end if;
  if v_received > v_dpp + v_ppn then
    raise exception 'Sudah diterima melebihi total invoice';
  end if;
  insert into public.invoices (
    number, project_id, kind, description, invoice_date, due_date, gross_amount, dpp, ppn_rate, ppn_amount, total,
    status, issued_at, issued_by, notes
  ) values (
    btrim(p_values ->> 'number'), (p_values ->> 'project_id')::uuid, 'opening',
    coalesce(nullif(btrim(p_values ->> 'description'), ''), 'Saldo awal piutang'),
    v_date, coalesce((p_values ->> 'due_date')::date, v_date), v_dpp, v_dpp,
    case when v_dpp > 0 then round(v_ppn * 100 / v_dpp, 2) else 0 end, v_ppn, v_dpp + v_ppn,
    'issued', now(), auth.uid(), 'Saldo awal (impor)'
  )
  returning id into v_id;
  if v_received > 0 then
    insert into public.invoice_payments (invoice_id, payment_date, amount_received, is_opening, notes)
    values (v_id, v_date, v_received, true, 'Sudah diterima sebelum cut-off');
  end if;
  perform public.invoice_refresh(v_id);
  return v_id;
exception when unique_violation then
  raise exception 'Nomor invoice sudah ada';
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.save_invoice(uuid, jsonb)',
    'public.issue_invoice(uuid)',
    'public.record_invoice_payment(uuid, jsonb)',
    'public.cancel_invoice_payment(uuid, text)',
    'public.cancel_invoice(uuid, text)',
    'public.import_opening_invoice(jsonb)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Views (FIN-04, FIN-05, PRD §11.4)
-- ---------------------------------------------------------------------------
create view public.invoice_list
with (security_invoker = true)
as
select
  i.id,
  i.number,
  i.project_id,
  p.code as project_code,
  p.name as project_name,
  p.client_id,
  c.name as client_name,
  i.term_id,
  t.name as term_name,
  i.kind,
  i.description,
  i.invoice_date,
  i.due_date,
  i.gross_amount,
  i.dp_deduction,
  i.retention_deduction,
  i.other_deduction,
  i.other_deduction_note,
  i.dpp,
  i.ppn_rate,
  i.ppn_amount,
  i.total,
  i.status,
  i.notes,
  i.issued_at,
  i.cancel_reason,
  i.created_at,
  coalesce(pay.received, 0) as received,
  coalesce(pay.pph, 0) as pph,
  case when i.status in ('issued', 'partial', 'paid')
       then i.total - coalesce(pay.received, 0) - coalesce(pay.pph, 0) else 0 end as balance,
  case when i.status in ('issued', 'partial') and i.due_date < public.today_wib()
       then public.today_wib() - i.due_date else 0 end as days_overdue,
  case
    when i.status not in ('issued', 'partial') then null
    when i.due_date >= public.today_wib() then 'current'
    when public.today_wib() - i.due_date <= 30 then 'd1_30'
    when public.today_wib() - i.due_date <= 60 then 'd31_60'
    when public.today_wib() - i.due_date <= 90 then 'd61_90'
    else 'd90_plus'
  end as aging_bucket
from public.invoices i
join public.projects p on p.id = i.project_id
left join public.clients c on c.id = p.client_id
left join public.project_terms t on t.id = i.term_id
left join lateral (
  select sum(x.amount_received) as received, sum(x.pph_amount) as pph
  from public.invoice_payments x
  where x.invoice_id = i.id and x.status = 'active'
) pay on true;

create view public.receivable_aging
with (security_invoker = true)
as
select
  l.client_id,
  l.client_name,
  l.project_id,
  l.project_code,
  l.project_name,
  sum(l.balance) filter (where l.aging_bucket = 'current') as current_amount,
  sum(l.balance) filter (where l.aging_bucket = 'd1_30') as d1_30,
  sum(l.balance) filter (where l.aging_bucket = 'd31_60') as d31_60,
  sum(l.balance) filter (where l.aging_bucket = 'd61_90') as d61_90,
  sum(l.balance) filter (where l.aging_bucket = 'd90_plus') as d90_plus,
  sum(l.balance) as total_balance
from public.invoice_list l
where l.aging_bucket is not null and l.balance > 0
group by l.client_id, l.client_name, l.project_id, l.project_code, l.project_name;

-- ---------------------------------------------------------------------------
-- Daily check (FIN-04): H-7 and overdue, once each per invoice
-- ---------------------------------------------------------------------------
create or replace function public.check_receivables()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select id, number, project_code, client_name, due_date, balance, days_overdue
    from public.invoice_list
    where status in ('issued', 'partial') and balance > 0
      -- Windows, not exact days: a missed run still sends each reminder once (dedupe key).
      and due_date <= public.today_wib() + 7
  loop
    perform public.notify_roles(
      array['finance']::public.app_role[],
      'finance',
      case when r.days_overdue > 0 then 'Invoice lewat jatuh tempo' else 'Invoice segera jatuh tempo' end,
      format('%s · %s · sisa Rp %s · jatuh tempo %s', r.number, coalesce(r.client_name, r.project_code),
        replace(to_char(r.balance, 'FM999,999,999,999,990'), ',', '.'), public.format_date_id(r.due_date)),
      '/finance/invoices/' || r.id,
      case when r.days_overdue > 0 then 'invoice-overdue:' else 'invoice-due7:' end || r.id
    );
  end loop;
end;
$$;

revoke execute on function public.check_receivables() from public, anon, authenticated;

insert into public.scheduled_checks (name, function_name, description, sort_order) values
  ('receivables-due', 'public.check_receivables()',
   'Invoice H-7 sebelum jatuh tempo dan saat lewat jatuh tempo (FIN-04)', 70);

-- ---------------------------------------------------------------------------
-- Attachments: BAP and payment proof in a private finance bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('finance-files', 'finance-files', false, 10485760,
        array[
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ])
on conflict (id) do nothing;

create policy "Attachment readers read finance files" on storage.objects
  for select to authenticated
  using (bucket_id = 'finance-files' and public.can_access_attachment_path(name, false));

create policy "Attachment writers upload finance files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'finance-files' and public.can_access_attachment_path(name, true));

create policy "Attachment writers delete finance files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'finance-files' and public.can_access_attachment_path(name, true));

-- Later finance changes add their entity types to these three functions.
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
    when 'invoice' then 'finance-files'
    when 'invoice_payment' then 'finance-files'
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
    when 'invoice' then
      exists (select 1 from public.invoices i where i.id = p_entity_id)
    when 'invoice_payment' then
      exists (select 1 from public.invoice_payments x where x.id = p_entity_id)
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
    when 'invoice' then
      p_category in ('bap', 'other')
      and public.has_role('finance')
      and exists (select 1 from public.invoices i where i.id = p_entity_id and i.status <> 'cancelled')
    when 'invoice_payment' then
      p_category = 'proof'
      and public.has_role('finance')
      and exists (select 1 from public.invoice_payments x where x.id = p_entity_id)
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Invoice & piutang L L L K — L(status) —)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['invoices', 'invoice_payments']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
    execute format(
      'create policy "Receivable readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''marketing'', ''finance'')))', t);
  end loop;
end;
$$;

revoke all on table public.invoice_list from anon;
revoke all on table public.receivable_aging from anon;
