-- Payables, direct expenses, field cash and the kasbon ledger, plus the single
-- cost source view. PRD FIN-06 … FIN-10, FIN-13, PAY-05 base, PRJ-04 realisation
-- (change: add-payables-expenses).

-- ---------------------------------------------------------------------------
-- Supplier bills (FIN-06, FIN-07)
-- ---------------------------------------------------------------------------
create table public.supplier_bills (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete restrict,
  bill_no text not null check (length(btrim(bill_no)) > 0),
  bill_date date not null,
  due_date date not null,
  subtotal numeric(16, 2) not null default 0 check (subtotal >= 0),
  ppn_amount numeric(16, 2) not null default 0 check (ppn_amount >= 0),
  total numeric(16, 2) not null default 0 check (total >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid', 'cancelled')),
  delivery_note_id uuid references public.delivery_notes (id) on delete set null,
  notes text,
  is_opening boolean not null default false,
  -- Snapshot of §11.3 when the bill is saved: non-PKP companies carry PPN as
  -- cost, PKP companies do not. Kept per bill so a later PKP change does not
  -- rewrite past costs.
  ppn_is_cost boolean not null default false,
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total = subtotal + ppn_amount),
  check (due_date >= bill_date)
);

create unique index supplier_bills_number_key on public.supplier_bills (supplier_id, lower(btrim(bill_no))) where status <> 'cancelled';
create index supplier_bills_due_idx on public.supplier_bills (status, due_date);

create trigger supplier_bills_set_updated_at
before update on public.supplier_bills
for each row execute function public.set_updated_at();

create trigger supplier_bills_audit
after insert or update on public.supplier_bills
for each row execute function public.audit_row_change('id');

create table public.supplier_bill_lines (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.supplier_bills (id) on delete cascade,
  description text not null check (length(btrim(description)) > 0),
  amount numeric(16, 2) not null check (amount > 0),
  -- Null = Kantor/Umum (office overhead, FIN-13).
  project_id uuid references public.projects (id) on delete restrict,
  cost_category_id uuid not null references public.cost_categories (id) on delete restrict,
  sort_order integer not null default 0
);

create index supplier_bill_lines_bill_idx on public.supplier_bill_lines (bill_id, sort_order);
create index supplier_bill_lines_project_idx on public.supplier_bill_lines (project_id, cost_category_id);

create table public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.supplier_bills (id) on delete restrict,
  payment_date date not null,
  amount numeric(16, 2) not null check (amount > 0),
  method text not null default 'transfer' check (method in ('transfer', 'cash')),
  bank_account_id uuid references public.company_bank_accounts (id) on delete restrict,
  notes text,
  is_opening boolean not null default false,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index supplier_payments_bill_idx on public.supplier_payments (bill_id, payment_date);

create trigger supplier_payments_audit
after insert or update on public.supplier_payments
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- Direct expenses (FIN-09, FIN-13) and cost opening balances
-- ---------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  project_id uuid references public.projects (id) on delete restrict,
  cost_category_id uuid not null references public.cost_categories (id) on delete restrict,
  amount numeric(16, 2) not null check (amount > 0),
  payee text,
  method text not null default 'cash' check (method in ('cash', 'transfer', 'opening')),
  description text not null check (length(btrim(description)) > 0),
  no_receipt boolean not null default false,
  no_receipt_note text,
  delivery_note_id uuid references public.delivery_notes (id) on delete set null,
  is_opening boolean not null default false,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not no_receipt or length(btrim(coalesce(no_receipt_note, ''))) > 0)
);

create index expenses_project_idx on public.expenses (project_id, expense_date desc);

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

create trigger expenses_audit
after insert or update on public.expenses
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- Field cash (FIN-10)
-- ---------------------------------------------------------------------------
create table public.field_cash_movements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  kind text not null check (kind in ('topup', 'return')),
  movement_date date not null,
  amount numeric(16, 2) not null check (amount > 0),
  pic_employee_id uuid references public.employees (id) on delete restrict,
  method text not null default 'transfer' check (method in ('transfer', 'cash')),
  bank_account_id uuid references public.company_bank_accounts (id) on delete restrict,
  notes text,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index field_cash_movements_project_idx on public.field_cash_movements (project_id, movement_date);

create trigger field_cash_movements_audit
after insert or update on public.field_cash_movements
for each row execute function public.audit_row_change('id');

create table public.field_cash_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  expense_date date not null,
  kind text not null check (kind in ('project_cost', 'kasbon', 'wage_payment')),
  cost_category_id uuid references public.cost_categories (id) on delete restrict,
  employee_id uuid references public.employees (id) on delete restrict,
  installment_amount numeric(16, 2) check (installment_amount > 0),
  amount numeric(16, 2) not null check (amount > 0),
  description text not null check (length(btrim(description)) > 0),
  no_receipt boolean not null default false,
  no_receipt_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reject_reason text,
  verified_by uuid references public.profiles (id) on delete set null,
  verified_at timestamptz,
  cancel_reason text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'project_cost' or cost_category_id is not null),
  check (kind = 'project_cost' or employee_id is not null),
  check (not no_receipt or length(btrim(coalesce(no_receipt_note, ''))) > 0)
);

create index field_cash_expenses_project_idx on public.field_cash_expenses (project_id, expense_date desc);
create index field_cash_expenses_pending_idx on public.field_cash_expenses (status) where status = 'pending';

create trigger field_cash_expenses_set_updated_at
before update on public.field_cash_expenses
for each row execute function public.set_updated_at();

create trigger field_cash_expenses_audit
after insert or update on public.field_cash_expenses
for each row execute function public.audit_row_change('id');

-- ---------------------------------------------------------------------------
-- Kasbon ledger (PAY-05); installments come with payroll (change add-payroll)
-- ---------------------------------------------------------------------------
create table public.kasbons (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  kasbon_date date not null,
  amount numeric(16, 2) not null check (amount > 0),
  installment_amount numeric(16, 2) not null check (installment_amount > 0),
  description text,
  source text not null default 'manual' check (source in ('manual', 'field_cash', 'opening')),
  field_cash_expense_id uuid unique references public.field_cash_expenses (id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (installment_amount <= amount)
);

create index kasbons_employee_idx on public.kasbons (employee_id, kasbon_date);

create trigger kasbons_audit
after insert or update on public.kasbons
for each row execute function public.audit_row_change('id');

-- Kasbon audit entries are salary data: Direktur only (PRD §6).
create or replace function public.is_pay_table(p_table text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_table = any (array['employee_pay_settings', 'kasbons'])
$$;

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------
create or replace function public.supplier_bill_refresh(p_bill uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bill record;
  v_paid numeric;
  v_status text;
begin
  select id, status, total into v_bill from public.supplier_bills where id = p_bill for update;
  if v_bill.status = 'cancelled' then
    return;
  end if;
  select coalesce(sum(amount), 0) into v_paid from public.supplier_payments where bill_id = p_bill and status = 'active';
  v_status := case when v_paid >= v_bill.total and v_bill.total > 0 then 'paid' when v_paid > 0 then 'partial' else 'unpaid' end;
  if v_status <> v_bill.status then
    update public.supplier_bills set status = v_status where id = p_bill;
  end if;
end;
$$;

revoke execute on function public.supplier_bill_refresh(uuid) from public, anon, authenticated;

create or replace function public.require_finance()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role('finance') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.require_finance() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Supplier bill functions
-- p_bill: { supplier_id, bill_no, bill_date, due_date, ppn_amount, delivery_note_id, notes }
-- p_lines: [{ description, amount, project_id (null = Kantor/Umum), cost_category_id }]
-- ---------------------------------------------------------------------------
create or replace function public.save_supplier_bill(p_id uuid, p_bill jsonb, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_supplier uuid := (p_bill ->> 'supplier_id')::uuid;
  v_date date := coalesce((p_bill ->> 'bill_date')::date, public.today_wib());
  v_due date := (p_bill ->> 'due_date')::date;
  v_ppn numeric := coalesce((p_bill ->> 'ppn_amount')::numeric, 0);
  v_subtotal numeric := 0;
  v_line jsonb;
  v_position integer := 0;
  v_id uuid := p_id;
  v_status text;
begin
  perform public.require_finance();
  if v_supplier is null or not exists (select 1 from public.suppliers where id = v_supplier) then
    raise exception 'Pilih supplier';
  end if;
  if length(btrim(coalesce(p_bill ->> 'bill_no', ''))) = 0 then
    raise exception 'Isi nomor nota/faktur';
  end if;
  if v_ppn < 0 then
    raise exception 'PPN tidak boleh negatif';
  end if;
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then
    raise exception 'Tambahkan minimal satu baris rincian';
  end if;
  if v_due is null then
    v_due := v_date + coalesce((select payment_term_days from public.suppliers where id = v_supplier), 30);
  end if;
  if v_due < v_date then
    raise exception 'Jatuh tempo tidak boleh sebelum tanggal nota';
  end if;

  if p_id is not null then
    select status into v_status from public.supplier_bills where id = p_id for update;
    if not found then
      raise exception 'Tagihan tidak ditemukan';
    end if;
    if v_status = 'cancelled' then
      raise exception 'Tagihan batal tidak dapat diubah';
    end if;
    if exists (select 1 from public.supplier_payments where bill_id = p_id and status = 'active') then
      raise exception 'Tagihan yang sudah dibayar tidak dapat diubah; batalkan pembayaran dulu';
    end if;
  end if;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    if length(btrim(coalesce(v_line ->> 'description', ''))) = 0 then
      raise exception 'Setiap baris wajib memiliki uraian';
    end if;
    if coalesce((v_line ->> 'amount')::numeric, 0) <= 0 then
      raise exception 'Jumlah setiap baris harus lebih dari 0';
    end if;
    if nullif(v_line ->> 'cost_category_id', '') is null then
      raise exception 'Setiap baris wajib memiliki kategori biaya';
    end if;
    v_subtotal := v_subtotal + (v_line ->> 'amount')::numeric;
  end loop;

  if p_id is null then
    insert into public.supplier_bills (
      supplier_id, bill_no, bill_date, due_date, subtotal, ppn_amount, total, delivery_note_id, notes, ppn_is_cost
    )
    values (
      v_supplier, btrim(p_bill ->> 'bill_no'), v_date, v_due, v_subtotal, v_ppn, v_subtotal + v_ppn,
      nullif(p_bill ->> 'delivery_note_id', '')::uuid, nullif(btrim(p_bill ->> 'notes'), ''),
      not coalesce((select is_pkp from public.company_profile limit 1), false)
    )
    returning id into v_id;
  else
    update public.supplier_bills
    set supplier_id = v_supplier, bill_no = btrim(p_bill ->> 'bill_no'), bill_date = v_date, due_date = v_due,
        subtotal = v_subtotal, ppn_amount = v_ppn, total = v_subtotal + v_ppn,
        delivery_note_id = nullif(p_bill ->> 'delivery_note_id', '')::uuid, notes = nullif(btrim(p_bill ->> 'notes'), ''),
        ppn_is_cost = not coalesce((select is_pkp from public.company_profile limit 1), false)
    where id = p_id;
    delete from public.supplier_bill_lines where bill_id = p_id;
  end if;

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_position := v_position + 1;
    insert into public.supplier_bill_lines (bill_id, description, amount, project_id, cost_category_id, sort_order)
    values (
      v_id, btrim(v_line ->> 'description'), (v_line ->> 'amount')::numeric,
      nullif(v_line ->> 'project_id', '')::uuid, (v_line ->> 'cost_category_id')::uuid, v_position
    );
  end loop;
  return v_id;
exception when unique_violation then
  raise exception 'Nomor nota ini sudah tercatat untuk supplier tersebut';
end;
$$;

-- p_values: { payment_date, amount, method, bank_account_id, notes }
create or replace function public.record_supplier_payment(p_bill uuid, p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bill record;
  v_amount numeric := (p_values ->> 'amount')::numeric;
  v_paid numeric;
  v_date date := coalesce((p_values ->> 'payment_date')::date, public.today_wib());
  v_id uuid;
begin
  perform public.require_finance();
  select id, status, total into v_bill from public.supplier_bills where id = p_bill for update;
  if not found then
    raise exception 'Tagihan tidak ditemukan';
  end if;
  if v_bill.status not in ('unpaid', 'partial') then
    raise exception 'Tagihan sudah lunas atau batal';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'Isi jumlah pembayaran';
  end if;
  if v_date > public.today_wib() then
    raise exception 'Tanggal pembayaran tidak boleh melewati hari ini';
  end if;
  select coalesce(sum(amount), 0) into v_paid from public.supplier_payments where bill_id = p_bill and status = 'active';
  if v_paid + v_amount > v_bill.total then
    raise exception 'Pembayaran melebihi sisa utang (Rp %)', replace(to_char(v_bill.total - v_paid, 'FM999,999,999,999,990'), ',', '.');
  end if;
  insert into public.supplier_payments (bill_id, payment_date, amount, method, bank_account_id, notes)
  values (
    p_bill, v_date, v_amount, coalesce(nullif(p_values ->> 'method', ''), 'transfer'),
    nullif(p_values ->> 'bank_account_id', '')::uuid, nullif(btrim(p_values ->> 'notes'), '')
  )
  returning id into v_id;
  perform public.supplier_bill_refresh(p_bill);
  return v_id;
end;
$$;

create or replace function public.cancel_supplier_payment(p_payment uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
begin
  perform public.require_finance();
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  select id, bill_id, status into v_payment from public.supplier_payments where id = p_payment for update;
  if not found or v_payment.status <> 'active' then
    raise exception 'Pembayaran tidak ditemukan atau sudah dibatalkan';
  end if;
  update public.supplier_payments set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now() where id = p_payment;
  perform public.supplier_bill_refresh(v_payment.bill_id);
end;
$$;

create or replace function public.cancel_supplier_bill(p_bill uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_finance();
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  if not exists (select 1 from public.supplier_bills where id = p_bill and status <> 'cancelled') then
    raise exception 'Tagihan tidak ditemukan atau sudah batal';
  end if;
  if exists (select 1 from public.supplier_payments where bill_id = p_bill and status = 'active') then
    raise exception 'Batalkan dulu pembayaran yang tercatat pada tagihan ini';
  end if;
  update public.supplier_bills set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now() where id = p_bill;
end;
$$;

-- UMM-13: open bill from before cut-off; not a cost (cost to cut-off is imported per category).
-- p_values: { supplier_id, bill_no, bill_date, due_date, total, ppn_amount, paid }
create or replace function public.import_opening_bill(p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total numeric := (p_values ->> 'total')::numeric;
  v_ppn numeric := coalesce((p_values ->> 'ppn_amount')::numeric, 0);
  v_paid numeric := coalesce((p_values ->> 'paid')::numeric, 0);
  v_date date := (p_values ->> 'bill_date')::date;
  v_id uuid;
begin
  perform public.require_finance();
  if v_total is null or v_total <= 0 or v_ppn < 0 or v_ppn > v_total or v_paid < 0 or v_paid > v_total then
    raise exception 'Nilai tidak valid';
  end if;
  insert into public.supplier_bills (supplier_id, bill_no, bill_date, due_date, subtotal, ppn_amount, total, is_opening, notes)
  values (
    (p_values ->> 'supplier_id')::uuid, btrim(p_values ->> 'bill_no'), v_date, coalesce((p_values ->> 'due_date')::date, v_date),
    v_total - v_ppn, v_ppn, v_total, true, 'Saldo awal (impor)'
  )
  returning id into v_id;
  insert into public.supplier_bill_lines (bill_id, description, amount, project_id, cost_category_id)
  values (v_id, 'Saldo awal utang', v_total - v_ppn, null, (select id from public.cost_categories where code = 'OTHER'));
  if v_paid > 0 then
    insert into public.supplier_payments (bill_id, payment_date, amount, is_opening, notes)
    values (v_id, v_date, v_paid, true, 'Sudah dibayar sebelum cut-off');
  end if;
  perform public.supplier_bill_refresh(v_id);
  return v_id;
exception when unique_violation then
  raise exception 'Nomor nota ini sudah tercatat untuk supplier tersebut';
end;
$$;

-- ---------------------------------------------------------------------------
-- Direct expense functions (FIN-09)
-- p_values: { expense_date, project_id, cost_category_id, amount, payee, method,
--   description, no_receipt, no_receipt_note, delivery_note_id, is_opening }
-- ---------------------------------------------------------------------------
create or replace function public.save_expense(p_id uuid, p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_amount numeric := (p_values ->> 'amount')::numeric;
  v_no_receipt boolean := coalesce((p_values ->> 'no_receipt')::boolean, false);
  v_opening boolean := coalesce((p_values ->> 'is_opening')::boolean, false);
begin
  perform public.require_finance();
  if v_amount is null or v_amount <= 0 then
    raise exception 'Jumlah harus lebih dari 0';
  end if;
  if nullif(p_values ->> 'cost_category_id', '') is null then
    raise exception 'Pilih kategori biaya';
  end if;
  if length(btrim(coalesce(p_values ->> 'description', ''))) = 0 then
    raise exception 'Isi keterangan pengeluaran';
  end if;
  if v_no_receipt and length(btrim(coalesce(p_values ->> 'no_receipt_note', ''))) = 0 then
    raise exception 'Pengeluaran tanpa nota wajib diberi keterangan';
  end if;
  if (p_values ->> 'expense_date')::date > public.today_wib() then
    raise exception 'Tanggal tidak boleh melewati hari ini';
  end if;
  if p_id is null then
    insert into public.expenses (
      expense_date, project_id, cost_category_id, amount, payee, method, description, no_receipt, no_receipt_note,
      delivery_note_id, is_opening
    ) values (
      coalesce((p_values ->> 'expense_date')::date, public.today_wib()), nullif(p_values ->> 'project_id', '')::uuid,
      (p_values ->> 'cost_category_id')::uuid, v_amount, nullif(btrim(p_values ->> 'payee'), ''),
      case when v_opening then 'opening' else coalesce(nullif(p_values ->> 'method', ''), 'cash') end,
      btrim(p_values ->> 'description'), v_no_receipt, nullif(btrim(p_values ->> 'no_receipt_note'), ''),
      nullif(p_values ->> 'delivery_note_id', '')::uuid, v_opening
    )
    returning id into v_id;
  else
    update public.expenses
    set expense_date = (p_values ->> 'expense_date')::date,
        project_id = nullif(p_values ->> 'project_id', '')::uuid,
        cost_category_id = (p_values ->> 'cost_category_id')::uuid,
        amount = v_amount,
        payee = nullif(btrim(p_values ->> 'payee'), ''),
        method = coalesce(nullif(p_values ->> 'method', ''), method),
        description = btrim(p_values ->> 'description'),
        no_receipt = v_no_receipt,
        no_receipt_note = nullif(btrim(p_values ->> 'no_receipt_note'), ''),
        delivery_note_id = nullif(p_values ->> 'delivery_note_id', '')::uuid
    where id = p_id and status = 'active';
    if not found then
      raise exception 'Pengeluaran tidak ditemukan atau sudah batal';
    end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.cancel_expense(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_finance();
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  update public.expenses set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now()
  where id = p_id and status = 'active';
  if not found then
    raise exception 'Pengeluaran tidak ditemukan atau sudah batal';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Field cash functions (FIN-10)
-- ---------------------------------------------------------------------------
-- p_values: { project_id, kind topup|return, movement_date, amount, pic_employee_id, method, bank_account_id, notes }
create or replace function public.record_field_cash_movement(p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount numeric := (p_values ->> 'amount')::numeric;
  v_kind text := p_values ->> 'kind';
  v_id uuid;
begin
  perform public.require_finance();
  if v_kind not in ('topup', 'return') then
    raise exception 'Jenis tidak valid';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'Jumlah harus lebih dari 0';
  end if;
  if (p_values ->> 'movement_date')::date > public.today_wib() then
    raise exception 'Tanggal tidak boleh melewati hari ini';
  end if;
  insert into public.field_cash_movements (project_id, kind, movement_date, amount, pic_employee_id, method, bank_account_id, notes)
  values (
    (p_values ->> 'project_id')::uuid, v_kind, coalesce((p_values ->> 'movement_date')::date, public.today_wib()), v_amount,
    nullif(p_values ->> 'pic_employee_id', '')::uuid, coalesce(nullif(p_values ->> 'method', ''), 'transfer'),
    nullif(p_values ->> 'bank_account_id', '')::uuid, nullif(btrim(p_values ->> 'notes'), '')
  )
  returning id into v_id;
  if v_kind = 'topup' then
    perform public.notify_project_field(
      (p_values ->> 'project_id')::uuid, 'finance', 'Kas lapangan ditambah',
      format('Top-up Rp %s', replace(to_char(v_amount, 'FM999,999,999,999,990'), ',', '.')),
      '/finance/field-cash/' || (p_values ->> 'project_id'), 'fieldcash-topup:' || v_id
    );
  end if;
  return v_id;
end;
$$;

create or replace function public.cancel_field_cash_movement(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_finance();
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  update public.field_cash_movements set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now()
  where id = p_id and status = 'active';
  if not found then
    raise exception 'Data tidak ditemukan atau sudah batal';
  end if;
end;
$$;

-- p_values: { project_id, expense_date, kind, cost_category_id, employee_id, installment_amount,
--   amount, description, no_receipt, no_receipt_note }
create or replace function public.record_field_cash_expense(p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid := (p_values ->> 'project_id')::uuid;
  v_kind text := p_values ->> 'kind';
  v_date date := coalesce((p_values ->> 'expense_date')::date, public.today_wib());
  v_amount numeric := (p_values ->> 'amount')::numeric;
  v_no_receipt boolean := coalesce((p_values ->> 'no_receipt')::boolean, false);
  v_installment numeric := nullif(p_values ->> 'installment_amount', '')::numeric;
  v_code text;
  v_id uuid;
begin
  if not (public.has_role('finance') or (public.has_role('field') and v_project in (select public.user_project_ids()))) then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if v_kind not in ('project_cost', 'kasbon', 'wage_payment') then
    raise exception 'Pilih jenis pengeluaran';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'Jumlah harus lebih dari 0';
  end if;
  if v_date > public.today_wib() then
    raise exception 'Tanggal tidak boleh melewati hari ini';
  end if;
  if public.has_role('field') and v_date < public.today_wib() - public.backdate_days() then
    raise exception 'Input paling lambat H+% dari tanggal pengeluaran', public.backdate_days();
  end if;
  if v_kind = 'project_cost' and nullif(p_values ->> 'cost_category_id', '') is null then
    raise exception 'Pilih kategori biaya';
  end if;
  if v_kind <> 'project_cost' and nullif(p_values ->> 'employee_id', '') is null then
    raise exception 'Pilih karyawan';
  end if;
  if v_kind = 'kasbon' and v_installment is not null and v_installment > v_amount then
    raise exception 'Cicilan tidak boleh melebihi jumlah kasbon';
  end if;
  if length(btrim(coalesce(p_values ->> 'description', ''))) = 0 then
    raise exception 'Isi keterangan pengeluaran';
  end if;
  if v_no_receipt and length(btrim(coalesce(p_values ->> 'no_receipt_note', ''))) = 0 then
    raise exception 'Pengeluaran tanpa nota wajib diberi keterangan';
  end if;

  insert into public.field_cash_expenses (
    project_id, expense_date, kind, cost_category_id, employee_id, installment_amount, amount, description,
    no_receipt, no_receipt_note
  ) values (
    v_project, v_date, v_kind,
    case when v_kind = 'project_cost' then (p_values ->> 'cost_category_id')::uuid end,
    case when v_kind <> 'project_cost' then (p_values ->> 'employee_id')::uuid end,
    case when v_kind = 'kasbon' then coalesce(v_installment, v_amount) end,
    v_amount, btrim(p_values ->> 'description'), v_no_receipt, nullif(btrim(p_values ->> 'no_receipt_note'), '')
  )
  returning id into v_id;

  select code into v_code from public.projects where id = v_project;
  perform public.notify_roles(
    array['finance']::public.app_role[], 'finance', 'Kas lapangan menunggu verifikasi',
    format('%s · ada pengeluaran baru untuk diverifikasi', v_code),
    '/finance/field-cash/' || v_project, format('fieldcash-pending:%s:%s', v_project, public.today_wib())
  );
  return v_id;
end;
$$;

create or replace function public.verify_field_cash_expense(p_id uuid, p_approve boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  perform public.require_finance();
  select * into v_row from public.field_cash_expenses where id = p_id for update;
  if not found then
    raise exception 'Pengeluaran tidak ditemukan';
  end if;
  if v_row.status <> 'pending' then
    raise exception 'Pengeluaran sudah diverifikasi atau batal';
  end if;
  if not p_approve and length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan penolakan';
  end if;
  update public.field_cash_expenses
  set status = case when p_approve then 'approved' else 'rejected' end,
      reject_reason = case when p_approve then null else btrim(p_reason) end,
      verified_by = auth.uid(), verified_at = now()
  where id = p_id;

  if p_approve and v_row.kind = 'kasbon' then
    insert into public.kasbons (employee_id, kasbon_date, amount, installment_amount, description, source, field_cash_expense_id)
    values (v_row.employee_id, v_row.expense_date, v_row.amount, coalesce(v_row.installment_amount, v_row.amount),
            v_row.description, 'field_cash', v_row.id);
  end if;
  if not p_approve and v_row.created_by is not null then
    perform public.notify_user(
      v_row.created_by, 'finance', 'Pengeluaran kas lapangan ditolak',
      format('Rp %s · %s', replace(to_char(v_row.amount, 'FM999,999,999,999,990'), ',', '.'), btrim(p_reason)),
      '/finance/field-cash/expenses/' || p_id, 'fieldcash-rejected:' || p_id
    );
  end if;
end;
$$;

create or replace function public.cancel_field_cash_expense(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_finance();
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  update public.field_cash_expenses set status = 'cancelled', cancel_reason = btrim(p_reason)
  where id = p_id and status = 'pending';
  if not found then
    raise exception 'Hanya pengeluaran yang menunggu verifikasi yang dapat dibatalkan';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Kasbon functions (PAY-05)
-- p_values: { employee_id, kasbon_date, amount, installment_amount, description, source }
-- ---------------------------------------------------------------------------
create or replace function public.save_kasbon(p_values jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount numeric := (p_values ->> 'amount')::numeric;
  v_installment numeric := (p_values ->> 'installment_amount')::numeric;
  v_source text := coalesce(nullif(p_values ->> 'source', ''), 'manual');
  v_id uuid;
begin
  if not public.has_role('finance', 'hcm') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if v_source not in ('manual', 'opening') then
    raise exception 'Sumber kasbon tidak valid';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'Jumlah kasbon harus lebih dari 0';
  end if;
  if v_installment is null or v_installment <= 0 or v_installment > v_amount then
    raise exception 'Cicilan harus lebih dari 0 dan tidak melebihi jumlah kasbon';
  end if;
  if not exists (select 1 from public.employees where id = (p_values ->> 'employee_id')::uuid) then
    raise exception 'Karyawan tidak ditemukan';
  end if;
  insert into public.kasbons (employee_id, kasbon_date, amount, installment_amount, description, source)
  values (
    (p_values ->> 'employee_id')::uuid, coalesce((p_values ->> 'kasbon_date')::date, public.today_wib()), v_amount,
    v_installment, nullif(btrim(p_values ->> 'description'), ''), v_source
  )
  returning id into v_id;
  return v_id;
end;
$$;

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
  update public.kasbons set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now()
  where id = p_id and status = 'active';
  if not found then
    raise exception 'Kasbon tidak ditemukan atau sudah batal';
  end if;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.save_supplier_bill(uuid, jsonb, jsonb)',
    'public.record_supplier_payment(uuid, jsonb)',
    'public.cancel_supplier_payment(uuid, text)',
    'public.cancel_supplier_bill(uuid, text)',
    'public.import_opening_bill(jsonb)',
    'public.save_expense(uuid, jsonb)',
    'public.cancel_expense(uuid, text)',
    'public.record_field_cash_movement(jsonb)',
    'public.cancel_field_cash_movement(uuid, text)',
    'public.record_field_cash_expense(jsonb)',
    'public.verify_field_cash_expense(uuid, boolean, text)',
    'public.cancel_field_cash_expense(uuid, text)',
    'public.save_kasbon(jsonb)',
    'public.cancel_kasbon(uuid, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Single cost source (PRD §11.3, FIN-11, FIN-13)
-- ---------------------------------------------------------------------------
create view public.cost_entries
with (security_invoker = true)
as
select
  'supplier_bill'::text as source,
  b.id as source_id,
  b.bill_date as entry_date,
  l.project_id,
  l.cost_category_id,
  -- Non-PKP when saved (ppn_is_cost): the bill's PPN is spread over its lines.
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
where f.status = 'approved' and f.kind = 'project_cost';

create or replace view public.project_category_costs
with (security_invoker = true)
as
select c.project_id, c.cost_category_id, sum(c.amount)::numeric as amount
from public.cost_entries c
where c.project_id is not null
group by c.project_id, c.cost_category_id;

-- ---------------------------------------------------------------------------
-- Payables views (FIN-08, PRD §11.4)
-- ---------------------------------------------------------------------------
create view public.supplier_bill_list
with (security_invoker = true)
as
select
  b.id,
  b.supplier_id,
  s.name as supplier_name,
  b.bill_no,
  b.bill_date,
  b.due_date,
  b.subtotal,
  b.ppn_amount,
  b.total,
  b.status,
  b.delivery_note_id,
  dn.number as delivery_note_number,
  b.notes,
  b.is_opening,
  b.cancel_reason,
  b.created_at,
  coalesce(p.paid, 0) as paid,
  case when b.status = 'cancelled' then 0 else b.total - coalesce(p.paid, 0) end as balance,
  case when b.status in ('unpaid', 'partial') and b.due_date < public.today_wib() then public.today_wib() - b.due_date else 0 end
    as days_overdue,
  case
    when b.status not in ('unpaid', 'partial') then null
    when b.due_date < public.today_wib() then 'overdue'
    when b.due_date < public.today_wib() + 7 then 'this_week'
    when b.due_date < public.today_wib() + 14 then 'next_week'
    else 'later'
  end as due_group,
  case
    when b.status not in ('unpaid', 'partial') then null
    when b.due_date >= public.today_wib() then 'current'
    when public.today_wib() - b.due_date <= 30 then 'd1_30'
    when public.today_wib() - b.due_date <= 60 then 'd31_60'
    when public.today_wib() - b.due_date <= 90 then 'd61_90'
    else 'd90_plus'
  end as aging_bucket,
  (select string_agg(distinct coalesce(pr.code, 'Kantor/Umum'), ', ')
   from public.supplier_bill_lines l left join public.projects pr on pr.id = l.project_id
   where l.bill_id = b.id) as projects
from public.supplier_bills b
join public.suppliers s on s.id = b.supplier_id
left join public.delivery_notes dn on dn.id = b.delivery_note_id
left join lateral (
  select sum(x.amount) as paid from public.supplier_payments x where x.bill_id = b.id and x.status = 'active'
) p on true;

create view public.payable_aging
with (security_invoker = true)
as
select
  l.supplier_id,
  l.supplier_name,
  sum(l.balance) filter (where l.aging_bucket = 'current') as current_amount,
  sum(l.balance) filter (where l.aging_bucket = 'd1_30') as d1_30,
  sum(l.balance) filter (where l.aging_bucket = 'd31_60') as d31_60,
  sum(l.balance) filter (where l.aging_bucket = 'd61_90') as d61_90,
  sum(l.balance) filter (where l.aging_bucket = 'd90_plus') as d90_plus,
  sum(l.balance) as total_balance
from public.supplier_bill_list l
where l.aging_bucket is not null and l.balance > 0
group by l.supplier_id, l.supplier_name;

-- ---------------------------------------------------------------------------
-- Field cash views (PRD §11.3 Saldo Kas Lapangan)
-- ---------------------------------------------------------------------------
create view public.field_cash_balances
with (security_invoker = true)
as
select
  p.id as project_id,
  p.code as project_code,
  p.name as project_name,
  p.status as project_status,
  coalesce(m.topups, 0) as topups,
  coalesce(m.returns, 0) as returns,
  coalesce(x.approved, 0) as approved,
  coalesce(x.pending, 0) as pending,
  coalesce(x.pending_count, 0)::int as pending_count,
  coalesce(m.topups, 0) - coalesce(x.approved, 0) - coalesce(x.pending, 0) - coalesce(m.returns, 0) as balance
from public.projects p
left join lateral (
  select
    sum(amount) filter (where kind = 'topup') as topups,
    sum(amount) filter (where kind = 'return') as returns
  from public.field_cash_movements where project_id = p.id and status = 'active'
) m on true
left join lateral (
  select
    sum(amount) filter (where status = 'approved') as approved,
    sum(amount) filter (where status = 'pending') as pending,
    count(*) filter (where status = 'pending') as pending_count
  from public.field_cash_expenses where project_id = p.id
) x on true
where exists (select 1 from public.field_cash_movements fm where fm.project_id = p.id)
   or exists (select 1 from public.field_cash_expenses fe where fe.project_id = p.id);

create view public.field_cash_ledger
with (security_invoker = true)
as
select
  m.id, m.project_id, m.kind, m.movement_date as entry_date, m.amount, m.notes as description,
  null::uuid as cost_category_id, null::text as category_name, m.pic_employee_id as employee_id,
  pe.full_name as employee_name, m.status, null::text as reject_reason, m.created_by, m.created_at, false as no_receipt
from public.field_cash_movements m
left join public.employees pe on pe.id = m.pic_employee_id
union all
select
  f.id, f.project_id, f.kind, f.expense_date, f.amount, f.description, f.cost_category_id, c.name, f.employee_id,
  e.full_name, f.status, f.reject_reason, f.created_by, f.created_at, f.no_receipt
from public.field_cash_expenses f
left join public.cost_categories c on c.id = f.cost_category_id
left join public.employees e on e.id = f.employee_id;

-- Installments are added by add-payroll.
create view public.kasbon_balances
with (security_invoker = true)
as
select
  k.id, k.employee_id, e.employee_no, e.full_name, k.kasbon_date, k.amount, k.installment_amount, k.description,
  k.source, k.field_cash_expense_id, k.status, k.cancel_reason, k.created_at,
  0::numeric as deducted,
  case when k.status = 'active' then k.amount else 0 end as balance
from public.kasbons k
join public.employees e on e.id = k.employee_id;

-- ---------------------------------------------------------------------------
-- Daily check (FIN-08): H-3 before a supplier bill is due
-- ---------------------------------------------------------------------------
create or replace function public.check_payables()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select id, supplier_name, bill_no, due_date, balance
    from public.supplier_bill_list
    -- A window, not one exact day: a missed run still sends the reminder once (dedupe key).
    where status in ('unpaid', 'partial') and balance > 0
      and due_date between public.today_wib() and public.today_wib() + 3
  loop
    perform public.notify_roles(
      array['finance']::public.app_role[], 'finance', 'Tagihan supplier segera jatuh tempo',
      format('%s · %s · sisa Rp %s · %s', r.supplier_name, r.bill_no,
        replace(to_char(r.balance, 'FM999,999,999,999,990'), ',', '.'), public.format_date_id(r.due_date)),
      '/finance/bills/' || r.id, 'bill-due3:' || r.id
    );
  end loop;
end;
$$;

revoke execute on function public.check_payables() from public, anon, authenticated;

insert into public.scheduled_checks (name, function_name, description, sort_order) values
  ('payables-due', 'public.check_payables()', 'Tagihan supplier H-3 sebelum jatuh tempo (FIN-08)', 80);

-- ---------------------------------------------------------------------------
-- Attachments (bucket finance-files)
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
    when 'tool' then 'project-files'
    when 'delivery_note' then 'project-files'
    when 'material_transaction' then 'project-files'
    when 'incident' then 'k3-files'
    when 'incident_action' then 'k3-files'
    when 'invoice' then 'finance-files'
    when 'invoice_payment' then 'finance-files'
    when 'supplier_bill' then 'finance-files'
    when 'supplier_payment' then 'finance-files'
    when 'expense' then 'finance-files'
    when 'field_cash_expense' then 'finance-files'
    when 'field_cash_movement' then 'finance-files'
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
    when 'supplier_bill' then
      exists (select 1 from public.supplier_bills b where b.id = p_entity_id)
    when 'supplier_payment' then
      exists (select 1 from public.supplier_payments x where x.id = p_entity_id)
    when 'expense' then
      exists (select 1 from public.expenses x where x.id = p_entity_id)
    when 'field_cash_expense' then
      exists (select 1 from public.field_cash_expenses x where x.id = p_entity_id)
    when 'field_cash_movement' then
      exists (select 1 from public.field_cash_movements x where x.id = p_entity_id)
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
    when 'supplier_bill' then
      p_category in ('invoice', 'other')
      and public.has_role('finance')
      and exists (select 1 from public.supplier_bills b where b.id = p_entity_id and b.status <> 'cancelled')
    when 'supplier_payment' then
      p_category = 'proof'
      and public.has_role('finance')
      and exists (select 1 from public.supplier_payments x where x.id = p_entity_id)
    when 'expense' then
      p_category = 'receipt'
      and public.has_role('finance')
      and exists (select 1 from public.expenses x where x.id = p_entity_id and x.status = 'active')
    when 'field_cash_expense' then
      p_category = 'receipt'
      and (
        public.has_role('finance')
        or (public.has_role('field') and exists (
          select 1 from public.field_cash_expenses x
          where x.id = p_entity_id and x.status = 'pending' and x.project_id in (select public.user_project_ids())
        ))
      )
      and exists (select 1 from public.field_cash_expenses x where x.id = p_entity_id)
    when 'field_cash_movement' then
      p_category = 'proof'
      and public.has_role('finance')
      and exists (select 1 from public.field_cash_movements x where x.id = p_entity_id)
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13)
-- Tagihan & utang, Pengeluaran & kas lapangan: L L — K — L, Lapangan K(P: catat)
-- Kasbon: — S(Dir) — K(Fin) K(HCM) — —
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'supplier_bills', 'supplier_bill_lines', 'supplier_payments', 'expenses',
    'field_cash_movements', 'field_cash_expenses', 'kasbons'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
  end loop;
  foreach t in array array[
    'supplier_bills', 'supplier_bill_lines', 'supplier_payments', 'expenses', 'field_cash_movements', 'field_cash_expenses'
  ]
  loop
    execute format(
      'create policy "Finance readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''finance'', ''operations'')))', t);
  end loop;
end;
$$;

create policy "Lapangan reads field cash of their projects" on public.field_cash_movements
  for select to authenticated
  using ((select public.has_role('field')) and project_id in (select public.user_project_ids()));

create policy "Lapangan reads field spending of their projects" on public.field_cash_expenses
  for select to authenticated
  using ((select public.has_role('field')) and project_id in (select public.user_project_ids()));

create policy "Salary readers read kasbon" on public.kasbons
  for select to authenticated
  using ((select public.has_role('finance', 'hcm', 'director')));

revoke all on table public.cost_entries from anon;
revoke all on table public.supplier_bill_list from anon;
revoke all on table public.payable_aging from anon;
revoke all on table public.field_cash_balances from anon;
revoke all on table public.field_cash_ledger from anon;
revoke all on table public.kasbon_balances from anon;
