-- Materials with stock per location (quantities only), a movement ledger,
-- receipts, usage, returns to the client, stock opname, material lines on the
-- surat jalan, titipan reconciliation and a minimum stock check.
-- PRD MAT-01 … MAT-07 (change: add-material-stock).

-- ---------------------------------------------------------------------------
-- Materials (MAT-01)
-- ---------------------------------------------------------------------------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  unit_code text not null references public.units (code) on delete restrict,
  category_id uuid not null references public.item_categories (id) on delete restrict,
  ownership text not null default 'company' check (ownership in ('company', 'client')),
  min_stock numeric(14, 3) check (min_stock >= 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index materials_code_key on public.materials (lower(btrim(code)));

create trigger materials_set_updated_at
before update on public.materials
for each row execute function public.set_updated_at();

create trigger materials_audit
after insert or update on public.materials
for each row execute function public.audit_row_change('id');

create or replace function public.materials_check_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.item_categories where id = new.category_id and kind = 'material') then
    raise exception 'Kategori harus kategori material';
  end if;
  return new;
end;
$$;

create trigger materials_check_category
before insert or update of category_id on public.materials
for each row execute function public.materials_check_category();

-- ---------------------------------------------------------------------------
-- Stock, transactions, surat jalan lines and the movement ledger
-- ---------------------------------------------------------------------------
-- Rows stay at 0 so "kept at this location" survives for the minimum check.
create table public.material_stock (
  material_id uuid not null references public.materials (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete restrict,
  quantity numeric(14, 3) not null default 0 check (quantity >= 0),
  primary key (material_id, location_id)
);

create index material_stock_location_idx on public.material_stock (location_id);

create table public.material_transactions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('opening', 'receipt', 'usage', 'return', 'opname')),
  location_id uuid not null references public.locations (id) on delete restrict,
  txn_date date not null,
  source text check (source in ('supplier', 'client')),
  supplier_id uuid references public.suppliers (id) on delete restrict,
  doc_no text,
  section_id uuid references public.project_sections (id) on delete restrict,
  notes text,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancel_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'receipt' or source is not null)
);

create index material_transactions_location_idx on public.material_transactions (location_id, txn_date desc);

create trigger material_transactions_set_updated_at
before update on public.material_transactions
for each row execute function public.set_updated_at();

create trigger material_transactions_audit
after insert or update on public.material_transactions
for each row execute function public.audit_row_change('id');

create table public.material_transaction_lines (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.material_transactions (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete restrict,
  -- Counted quantity for opname (may be 0); otherwise > 0 (checked in functions).
  quantity numeric(14, 3) not null check (quantity >= 0),
  system_quantity numeric(14, 3) check (system_quantity >= 0),
  sort_order integer not null default 0
);

create index material_transaction_lines_txn_idx on public.material_transaction_lines (transaction_id, sort_order);
create index material_transaction_lines_material_idx on public.material_transaction_lines (material_id);

create table public.delivery_note_material_lines (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.delivery_notes (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  received_quantity numeric(14, 3) check (received_quantity >= 0),
  missing numeric(14, 3) check (missing >= 0),
  receipt_note text,
  sort_order integer not null default 0,
  check (received_quantity is null or received_quantity + missing = quantity)
);

create index delivery_note_material_lines_note_idx on public.delivery_note_material_lines (note_id, sort_order);
create index delivery_note_material_lines_material_idx on public.delivery_note_material_lines (material_id);

create table public.material_movements (
  id bigint generated always as identity primary key,
  material_id uuid not null references public.materials (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete restrict,
  kind text not null check (kind in ('opening', 'receipt', 'usage', 'return', 'opname', 'send', 'receive', 'shortfall', 'cancel')),
  quantity numeric(14, 3) not null check (quantity > 0),
  -- Change to the stock at location_id (0 for a shortfall).
  delta numeric(14, 3) not null,
  transaction_id uuid references public.material_transactions (id) on delete set null,
  delivery_note_id uuid references public.delivery_notes (id) on delete set null,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);

create index material_movements_material_idx on public.material_movements (material_id, created_at);
create index material_movements_location_idx on public.material_movements (location_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- 2400.500 → "2.400,5" is done in the UI; SQL messages use "2400,5".
create or replace function public.material_qty_label(p_quantity numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(
    case when p_quantity::text like '%.%' then regexp_replace(p_quantity::text, '\.?0+$', '') else p_quantity::text end,
    '.', ',')
$$;

-- Internal: the only path that changes material stock; writes the ledger.
create or replace function public.material_post(
  p_material uuid,
  p_location uuid,
  p_kind text,
  p_quantity numeric,
  p_delta numeric,
  p_txn uuid,
  p_note_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  available numeric;
  material_code text;
  unit text;
  location_name text;
begin
  if p_delta <> 0 then
    insert into public.material_stock (material_id, location_id, quantity)
    values (p_material, p_location, 0)
    on conflict do nothing;
    select quantity into available
    from public.material_stock
    where material_id = p_material and location_id = p_location
    for update;
    if available + p_delta < 0 then
      select code, unit_code into material_code, unit from public.materials where id = p_material;
      select name into location_name from public.locations where id = p_location;
      raise exception 'Stok % di % tidak cukup: tersedia % %',
        material_code, location_name, public.material_qty_label(available), unit;
    end if;
    update public.material_stock
    set quantity = available + p_delta
    where material_id = p_material and location_id = p_location;
  end if;

  if p_quantity > 0 then
    insert into public.material_movements (
      material_id, location_id, kind, quantity, delta, transaction_id, delivery_note_id, note, created_by
    ) values (
      p_material, p_location, p_kind, p_quantity, p_delta, p_txn, p_note_id, nullif(btrim(p_note), ''), auth.uid()
    );
  end if;
end;
$$;

revoke execute on function public.material_post(uuid, uuid, text, numeric, numeric, uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Material functions (MAT-01 … MAT-05)
-- p_material: { code, name, unit_code, category_id, ownership, min_stock, notes }
-- ---------------------------------------------------------------------------
create or replace function public.create_material(p_material jsonb, p_location uuid default null, p_quantity numeric default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  txn_id uuid;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;

  insert into public.materials (code, name, unit_code, category_id, ownership, min_stock, notes)
  values (
    btrim(p_material ->> 'code'),
    btrim(p_material ->> 'name'),
    p_material ->> 'unit_code',
    (p_material ->> 'category_id')::uuid,
    coalesce(p_material ->> 'ownership', 'company'),
    (p_material ->> 'min_stock')::numeric,
    nullif(btrim(p_material ->> 'notes'), '')
  )
  returning id into new_id;

  if coalesce(p_quantity, 0) > 0 then
    if p_location is null or not exists (select 1 from public.locations where id = p_location and is_active) then
      raise exception 'Lokasi saldo awal tidak valid';
    end if;
    insert into public.material_transactions (kind, location_id, txn_date, notes)
    values ('opening', p_location, public.today_wib(), 'Saldo awal')
    returning id into txn_id;
    insert into public.material_transaction_lines (transaction_id, material_id, quantity)
    values (txn_id, new_id, p_quantity);
    perform public.material_post(new_id, p_location, 'opening', p_quantity, p_quantity, txn_id, null, 'Saldo awal');
  end if;
  return new_id;
end;
$$;

-- p_txn: { kind receipt|usage|return, location_id, txn_date, source, supplier_id, doc_no, section_id, notes }
-- p_lines: [{ material_id, quantity }]
create or replace function public.record_material_transaction(p_txn jsonb, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text := p_txn ->> 'kind';
  v_location uuid := (p_txn ->> 'location_id')::uuid;
  v_date date := coalesce((p_txn ->> 'txn_date')::date, public.today_wib());
  v_source text := nullif(p_txn ->> 'source', '');
  v_section uuid := nullif(p_txn ->> 'section_id', '')::uuid;
  v_is_field boolean := public.has_role('field');
  v_project record;
  v_material record;
  v_line record;
  v_position integer := 0;
  new_id uuid;
begin
  if v_kind is null or v_kind not in ('receipt', 'usage', 'return') then
    raise exception 'Jenis transaksi tidak valid';
  end if;
  if v_location is null or not exists (select 1 from public.locations where id = v_location and is_active) then
    raise exception 'Lokasi tidak valid';
  end if;
  if v_kind = 'return' then
    if not public.has_role('operations') then
      raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
    end if;
  elsif not (public.has_role('operations') or (v_is_field and v_location in (select public.user_location_ids()))) then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;

  select p.id, p.code into v_project from public.projects p where p.location_id = v_location;
  if v_kind in ('usage', 'return') and v_project.id is null then
    raise exception 'Pemakaian dan pengembalian hanya dicatat di lokasi proyek';
  end if;
  if v_date > public.today_wib() then
    raise exception 'Tanggal tidak boleh melewati hari ini';
  end if;
  if v_is_field and v_date < public.today_wib() - public.backdate_days() then
    raise exception 'Input paling lambat H+% dari tanggal transaksi', public.backdate_days();
  end if;
  if v_kind = 'receipt' and (v_source is null or v_source not in ('supplier', 'client')) then
    raise exception 'Pilih sumber penerimaan';
  end if;
  if v_kind <> 'receipt' then
    v_source := null;
  end if;
  if v_section is not null and (
    v_kind <> 'usage'
    or not exists (select 1 from public.project_sections s where s.id = v_section and s.project_id = v_project.id)
  ) then
    raise exception 'Seksi tidak valid untuk proyek ini';
  end if;
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then
    raise exception 'Tambahkan minimal satu material';
  end if;

  insert into public.material_transactions (kind, location_id, txn_date, source, supplier_id, doc_no, section_id, notes)
  values (
    v_kind, v_location, v_date, v_source,
    case when v_source = 'supplier' then nullif(p_txn ->> 'supplier_id', '')::uuid end,
    nullif(btrim(p_txn ->> 'doc_no'), ''),
    case when v_kind = 'usage' then v_section end,
    nullif(btrim(p_txn ->> 'notes'), '')
  )
  returning id into new_id;

  -- The same material on two lines is recorded as one.
  for v_line in
    select (e.item ->> 'material_id')::uuid as material_id, sum((e.item ->> 'quantity')::numeric) as quantity
    from jsonb_array_elements(p_lines) with ordinality as e(item, ord)
    group by 1
    order by min(e.ord)
  loop
    v_position := v_position + 1;
    if v_line.quantity is null or v_line.quantity <= 0 then
      raise exception 'Jumlah harus lebih dari 0';
    end if;
    select id, code, ownership into v_material from public.materials where id = v_line.material_id and is_active;
    if not found then
      raise exception 'Material tidak valid atau nonaktif';
    end if;
    if v_kind = 'return' and v_material.ownership <> 'client' then
      raise exception 'Hanya material titipan klien yang dapat dikembalikan (%)', v_material.code;
    end if;
    insert into public.material_transaction_lines (transaction_id, material_id, quantity, sort_order)
    values (new_id, v_line.material_id, v_line.quantity, v_position);
    perform public.material_post(
      v_line.material_id, v_location, v_kind, v_line.quantity,
      case when v_kind = 'receipt' then v_line.quantity else -v_line.quantity end,
      new_id, null, null
    );
  end loop;
  return new_id;
end;
$$;

-- MAT-05: counted quantities; differences are posted and audited.
-- p_lines: [{ material_id, counted_quantity }]
create or replace function public.record_stock_opname(p_location uuid, p_date date, p_reason text, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date := coalesce(p_date, public.today_wib());
  v_line record;
  v_material record;
  v_current numeric;
  v_diff numeric;
  v_changes text[] := '{}';
  v_position integer := 0;
  new_id uuid;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan stok opname';
  end if;
  if p_location is null or not exists (select 1 from public.locations where id = p_location and is_active) then
    raise exception 'Lokasi tidak valid';
  end if;
  if v_date > public.today_wib() then
    raise exception 'Tanggal tidak boleh melewati hari ini';
  end if;
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then
    raise exception 'Tambahkan minimal satu material';
  end if;
  if (select count(*) <> count(distinct e ->> 'material_id') from jsonb_array_elements(p_lines) e) then
    raise exception 'Satu material hanya boleh satu baris';
  end if;

  insert into public.material_transactions (kind, location_id, txn_date, notes)
  values ('opname', p_location, v_date, btrim(p_reason))
  returning id into new_id;

  for v_line in
    select (e.item ->> 'material_id')::uuid as material_id, (e.item ->> 'counted_quantity')::numeric as counted
    from jsonb_array_elements(p_lines) with ordinality as e(item, ord)
    order by e.ord
  loop
    v_position := v_position + 1;
    if v_line.counted is null or v_line.counted < 0 then
      raise exception 'Jumlah hitung tidak boleh kosong atau negatif';
    end if;
    select id, code, unit_code into v_material from public.materials where id = v_line.material_id;
    if not found then
      raise exception 'Material tidak valid';
    end if;
    insert into public.material_stock (material_id, location_id, quantity)
    values (v_line.material_id, p_location, 0)
    on conflict do nothing;
    select quantity into v_current
    from public.material_stock
    where material_id = v_line.material_id and location_id = p_location
    for update;
    v_diff := v_line.counted - v_current;

    insert into public.material_transaction_lines (transaction_id, material_id, quantity, system_quantity, sort_order)
    values (new_id, v_line.material_id, v_line.counted, v_current, v_position);

    if v_diff <> 0 then
      perform public.material_post(v_line.material_id, p_location, 'opname', abs(v_diff), v_diff, new_id, null, btrim(p_reason));
      v_changes := v_changes || format('%s: %s → %s %s', v_material.code, public.material_qty_label(v_current),
        public.material_qty_label(v_line.counted), v_material.unit_code);
    end if;
  end loop;

  insert into public.audit_log (table_name, record_id, action, actor_id, new_values, reason)
  values (
    'material_transactions', new_id::text, 'update', auth.uid(),
    jsonb_build_object(
      'stock_opname',
      format('%s: %s', (select name from public.locations where id = p_location),
        coalesce(nullif(array_to_string(v_changes, '; '), ''), 'tidak ada selisih'))
    ),
    btrim(p_reason)
  );
  return new_id;
end;
$$;

create or replace function public.cancel_material_transaction(p_txn uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_txn record;
  v_line record;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  select id, kind, status, location_id into v_txn from public.material_transactions where id = p_txn for update;
  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;
  if v_txn.status <> 'active' then
    raise exception 'Transaksi sudah dibatalkan';
  end if;
  if v_txn.kind = 'opname' then
    raise exception 'Stok opname tidak dapat dibatalkan; lakukan stok opname baru';
  end if;

  for v_line in select material_id, quantity from public.material_transaction_lines where transaction_id = p_txn
  loop
    perform public.material_post(
      v_line.material_id, v_txn.location_id, 'cancel', v_line.quantity,
      case when v_txn.kind in ('receipt', 'opening') then -v_line.quantity else v_line.quantity end,
      p_txn, null, btrim(p_reason)
    );
  end loop;

  update public.material_transactions
  set status = 'cancelled', cancel_reason = btrim(p_reason), cancelled_at = now(), cancelled_by = auth.uid()
  where id = p_txn;
end;
$$;

-- ---------------------------------------------------------------------------
-- Delivery notes carry material lines (MAT-04); same flow as ALT-03/ALT-04
-- p_material_lines (send): [{ material_id, quantity }]
-- p_material_lines (receive): [{ line_id, received_quantity, receipt_note }]
-- ---------------------------------------------------------------------------
drop function public.send_delivery_note(jsonb, jsonb);
drop function public.receive_delivery_note(uuid, jsonb, text);

create or replace function public.send_delivery_note(p_note jsonb, p_lines jsonb, p_material_lines jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  from_location uuid := (p_note ->> 'from_location_id')::uuid;
  to_location uuid := (p_note ->> 'to_location_id')::uuid;
  dated date := coalesce((p_note ->> 'note_date')::date, public.today_wib());
  tool_lines jsonb := coalesce(p_lines, '[]'::jsonb);
  material_lines jsonb := coalesce(p_material_lines, '[]'::jsonb);
  new_note_id uuid;
  note_number text;
  line record;
  position_index integer := 0;
  destination_project record;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if from_location is null or to_location is null or from_location = to_location then
    raise exception 'Lokasi asal dan tujuan harus berbeda';
  end if;
  if not exists (select 1 from public.locations where id = from_location and is_active)
     or not exists (select 1 from public.locations where id = to_location and is_active) then
    raise exception 'Lokasi tidak valid';
  end if;
  if dated > public.today_wib() then
    raise exception 'Tanggal surat jalan tidak boleh melewati hari ini';
  end if;
  if jsonb_array_length(tool_lines) + jsonb_array_length(material_lines) = 0 then
    raise exception 'Tambahkan minimal satu alat atau material';
  end if;

  note_number := public.next_document_number('delivery_note', dated);
  insert into public.delivery_notes (
    number, from_location_id, to_location_id, note_date, vehicle, driver, notes, status, sent_by, sent_at
  ) values (
    note_number, from_location, to_location, dated,
    nullif(btrim(p_note ->> 'vehicle'), ''), nullif(btrim(p_note ->> 'driver'), ''),
    nullif(btrim(p_note ->> 'notes'), ''), 'sent', auth.uid(), now()
  )
  returning id into new_note_id;

  -- Same tool and condition on two lines are sent as one.
  for line in
    select (e.item ->> 'tool_id')::uuid as tool_id, e.item ->> 'condition' as condition,
           sum((e.item ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(tool_lines) with ordinality as e(item, ord)
    group by 1, 2
    order by min(e.ord)
  loop
    position_index := position_index + 1;
    if line.condition not in ('good', 'damaged', 'repair') then
      raise exception 'Kondisi kirim tidak valid';
    end if;
    if line.quantity is null or line.quantity < 1 then
      raise exception 'Jumlah kirim minimal 1';
    end if;
    if not exists (select 1 from public.tools where id = line.tool_id and is_active) then
      raise exception 'Alat tidak valid atau nonaktif';
    end if;
    perform public.tool_stock_change(line.tool_id, from_location, line.condition, -line.quantity);
    insert into public.delivery_note_tool_lines (note_id, tool_id, condition, quantity, sort_order)
    values (new_note_id, line.tool_id, line.condition, line.quantity, position_index);
    insert into public.tool_movements (
      tool_id, kind, from_location_id, to_location_id, from_condition, quantity, delivery_note_id, created_by
    ) values (line.tool_id, 'send', from_location, to_location, line.condition, line.quantity, new_note_id, auth.uid());
  end loop;

  position_index := 0;
  for line in
    select (e.item ->> 'material_id')::uuid as material_id, sum((e.item ->> 'quantity')::numeric) as quantity
    from jsonb_array_elements(material_lines) with ordinality as e(item, ord)
    group by 1
    order by min(e.ord)
  loop
    position_index := position_index + 1;
    if line.quantity is null or line.quantity <= 0 then
      raise exception 'Jumlah material harus lebih dari 0';
    end if;
    if not exists (select 1 from public.materials where id = line.material_id and is_active) then
      raise exception 'Material tidak valid atau nonaktif';
    end if;
    insert into public.delivery_note_material_lines (note_id, material_id, quantity, sort_order)
    values (new_note_id, line.material_id, line.quantity, position_index);
    perform public.material_post(line.material_id, from_location, 'send', line.quantity, -line.quantity, null, new_note_id, null);
  end loop;

  select p.id, p.code into destination_project from public.projects p where p.location_id = to_location;
  if found then
    perform public.notify_project_field(
      destination_project.id,
      'equipment',
      case when jsonb_array_length(tool_lines) > 0 then 'Alat dikirim ke proyek' else 'Material dikirim ke proyek' end,
      format('%s · %s · konfirmasi saat diterima', note_number, destination_project.code),
      '/operations/delivery-notes/' || new_note_id,
      'delivery-sent:' || new_note_id
    );
  end if;
  return new_note_id;
end;
$$;

-- p_lines: [{ line_id, received_good, received_damaged, receipt_note }]
create or replace function public.receive_delivery_note(
  p_note uuid,
  p_lines jsonb,
  p_receipt_note text,
  p_material_lines jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  note record;
  line record;
  item jsonb;
  good integer;
  damaged integer;
  shortfall integer;
  received numeric;
  missing_qty numeric;
  discrepancy boolean := false;
begin
  select id, number, status, from_location_id, to_location_id into note
  from public.delivery_notes where id = p_note for update;
  if not found then
    raise exception 'Surat jalan tidak ditemukan';
  end if;
  if not (public.has_role('operations')
          or (public.has_role('field') and note.to_location_id in (select public.user_location_ids()))) then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if note.status <> 'sent' then
    raise exception 'Surat jalan sudah % dan tidak dapat dikonfirmasi',
      case note.status when 'received' then 'diterima' else 'dibatalkan' end;
  end if;

  for line in
    select l.id, l.tool_id, l.quantity, t.code
    from public.delivery_note_tool_lines l
    join public.tools t on t.id = l.tool_id
    where l.note_id = p_note
    order by l.sort_order
  loop
    item := null;
    select value into item from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb))
    where (value ->> 'line_id')::uuid = line.id;
    if item is null then
      raise exception 'Isi jumlah diterima untuk %', line.code;
    end if;
    good := coalesce((item ->> 'received_good')::integer, 0);
    damaged := coalesce((item ->> 'received_damaged')::integer, 0);
    if good < 0 or damaged < 0 or good + damaged > line.quantity then
      raise exception 'Jumlah diterima % melebihi jumlah kirim (%)', line.code, line.quantity;
    end if;
    shortfall := line.quantity - good - damaged;
    if (damaged > 0 or shortfall > 0) and length(btrim(coalesce(item ->> 'receipt_note', ''))) = 0 then
      raise exception 'Isi keterangan selisih untuk %', line.code;
    end if;
    if damaged > 0 or shortfall > 0 then
      discrepancy := true;
    end if;

    update public.delivery_note_tool_lines
    set received_good = good, received_damaged = damaged, missing = shortfall,
        receipt_note = nullif(btrim(item ->> 'receipt_note'), '')
    where id = line.id;

    if good > 0 then
      perform public.tool_stock_change(line.tool_id, note.to_location_id, 'good', good);
      insert into public.tool_movements (tool_id, kind, from_location_id, to_location_id, to_condition, quantity, delivery_note_id, created_by)
      values (line.tool_id, 'receive', note.from_location_id, note.to_location_id, 'good', good, p_note, auth.uid());
    end if;
    if damaged > 0 then
      perform public.tool_stock_change(line.tool_id, note.to_location_id, 'damaged', damaged);
      insert into public.tool_movements (tool_id, kind, from_location_id, to_location_id, to_condition, quantity, delivery_note_id, note, created_by)
      values (line.tool_id, 'receive', note.from_location_id, note.to_location_id, 'damaged', damaged, p_note,
              nullif(btrim(item ->> 'receipt_note'), ''), auth.uid());
    end if;
    if shortfall > 0 then
      perform public.tool_stock_change(line.tool_id, note.to_location_id, 'lost', shortfall);
      insert into public.tool_movements (tool_id, kind, from_location_id, to_location_id, to_condition, quantity, delivery_note_id, note, created_by)
      values (line.tool_id, 'shortfall', note.from_location_id, note.to_location_id, 'lost', shortfall, p_note,
              nullif(btrim(item ->> 'receipt_note'), ''), auth.uid());
    end if;
  end loop;

  for line in
    select l.id, l.material_id, l.quantity, m.code
    from public.delivery_note_material_lines l
    join public.materials m on m.id = l.material_id
    where l.note_id = p_note
    order by l.sort_order
  loop
    item := null;
    select value into item from jsonb_array_elements(coalesce(p_material_lines, '[]'::jsonb))
    where (value ->> 'line_id')::uuid = line.id;
    if item is null then
      raise exception 'Isi jumlah diterima untuk %', line.code;
    end if;
    received := (item ->> 'received_quantity')::numeric;
    if received is null or received < 0 or received > line.quantity then
      raise exception 'Jumlah diterima % tidak boleh melebihi jumlah kirim (%)', line.code, public.material_qty_label(line.quantity);
    end if;
    missing_qty := line.quantity - received;
    if missing_qty > 0 and length(btrim(coalesce(item ->> 'receipt_note', ''))) = 0 then
      raise exception 'Isi keterangan selisih untuk %', line.code;
    end if;
    if missing_qty > 0 then
      discrepancy := true;
    end if;

    update public.delivery_note_material_lines
    set received_quantity = received, missing = missing_qty, receipt_note = nullif(btrim(item ->> 'receipt_note'), '')
    where id = line.id;

    if received > 0 then
      perform public.material_post(line.material_id, note.to_location_id, 'receive', received, received, null, p_note, null);
    end if;
    if missing_qty > 0 then
      perform public.material_post(line.material_id, note.to_location_id, 'shortfall', missing_qty, 0, null, p_note,
        item ->> 'receipt_note');
    end if;
  end loop;

  if discrepancy and not exists (
    select 1 from public.attachments
    where entity_type = 'delivery_note' and entity_id = p_note and category = 'receipt'
  ) then
    raise exception 'Lampirkan minimal satu foto selisih sebelum konfirmasi';
  end if;

  update public.delivery_notes
  set status = 'received', received_by = auth.uid(), received_at = now(),
      receipt_note = nullif(btrim(p_receipt_note), '')
  where id = p_note;

  if discrepancy then
    perform public.notify_roles(
      array['operations']::public.app_role[],
      'equipment',
      'Selisih penerimaan surat jalan',
      format('%s · %s', note.number, (select name from public.locations where id = note.to_location_id)),
      '/operations/delivery-notes/' || p_note,
      'delivery-discrepancy:' || p_note
    );
  end if;
end;
$$;

create or replace function public.cancel_delivery_note(p_note uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  note record;
  line record;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan pembatalan';
  end if;
  select id, status, from_location_id, to_location_id into note
  from public.delivery_notes where id = p_note for update;
  if not found then
    raise exception 'Surat jalan tidak ditemukan';
  end if;
  if note.status <> 'sent' then
    raise exception 'Hanya surat jalan berstatus Dikirim yang dapat dibatalkan';
  end if;

  for line in select tool_id, condition, quantity from public.delivery_note_tool_lines where note_id = p_note
  loop
    perform public.tool_stock_change(line.tool_id, note.from_location_id, line.condition, line.quantity);
    insert into public.tool_movements (
      tool_id, kind, from_location_id, to_location_id, to_condition, quantity, delivery_note_id, note, created_by
    ) values (line.tool_id, 'cancel', note.to_location_id, note.from_location_id, line.condition, line.quantity,
              p_note, btrim(p_reason), auth.uid());
  end loop;

  for line in select material_id, quantity from public.delivery_note_material_lines where note_id = p_note
  loop
    perform public.material_post(line.material_id, note.from_location_id, 'cancel', line.quantity, line.quantity,
      null, p_note, btrim(p_reason));
  end loop;

  update public.delivery_notes
  set status = 'cancelled', cancelled_at = now(), cancel_reason = btrim(p_reason)
  where id = p_note;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.create_material(jsonb, uuid, numeric)',
    'public.record_material_transaction(jsonb, jsonb)',
    'public.record_stock_opname(uuid, date, text, jsonb)',
    'public.cancel_material_transaction(uuid, text)',
    'public.send_delivery_note(jsonb, jsonb, jsonb)',
    'public.receive_delivery_note(uuid, jsonb, text, jsonb)',
    'public.cancel_delivery_note(uuid, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Views (MAT-02 … MAT-07)
-- ---------------------------------------------------------------------------
-- MAT-07: company materials below minimum where they are kept (active
-- warehouses and projects that are not Selesai/Ditutup).
create view public.material_low_stock
with (security_invoker = true)
as
select
  s.material_id,
  m.code,
  m.name,
  m.unit_code,
  s.location_id,
  l.code as location_code,
  l.name as location_name,
  s.quantity,
  m.min_stock
from public.material_stock s
join public.materials m on m.id = s.material_id
join public.locations l on l.id = s.location_id
left join public.projects p on p.location_id = l.id
where m.is_active
  and m.ownership = 'company'
  and m.min_stock is not null
  and s.quantity < m.min_stock
  and l.is_active
  and (p.id is null or p.status not in ('completed', 'closed'));

create view public.material_overview
with (security_invoker = true)
as
select
  m.id,
  m.code,
  m.name,
  m.unit_code,
  u.name as unit_name,
  m.category_id,
  c.name as category_name,
  m.ownership,
  m.min_stock,
  m.notes,
  m.is_active,
  coalesce(st.on_hand, 0) as on_hand,
  coalesce(tr.in_transit, 0) as in_transit,
  coalesce(st.on_hand, 0) + coalesce(tr.in_transit, 0) as total,
  (select count(*) from public.material_low_stock x where x.material_id = m.id)::int as low_locations
from public.materials m
join public.item_categories c on c.id = m.category_id
join public.units u on u.code = m.unit_code
left join lateral (
  select sum(quantity) as on_hand from public.material_stock where material_id = m.id
) st on true
left join lateral (
  select sum(l.quantity) as in_transit
  from public.delivery_note_material_lines l
  join public.delivery_notes n on n.id = l.note_id
  where l.material_id = m.id and n.status = 'sent'
) tr on true;

-- MAT-06: per project × titipan material; cancelled rows drop out.
-- on hand = received + in − out − used − returned − shrinkage
create view public.material_reconciliation
with (security_invoker = true)
as
with flows as (
  select
    t.location_id,
    l.material_id,
    case when t.kind in ('receipt', 'opening') then l.quantity else 0 end as received,
    0::numeric as transferred_in,
    0::numeric as transferred_out,
    case when t.kind = 'usage' then l.quantity else 0 end as used,
    case when t.kind = 'return' then l.quantity else 0 end as returned,
    case when t.kind = 'opname' then l.system_quantity - l.quantity else 0 end as shrinkage
  from public.material_transactions t
  join public.material_transaction_lines l on l.transaction_id = t.id
  where t.status = 'active'
  union all
  select n.to_location_id, l.material_id, 0, l.quantity, 0, 0, 0, coalesce(l.missing, 0)
  from public.delivery_notes n
  join public.delivery_note_material_lines l on l.note_id = n.id
  where n.status = 'received'
  union all
  select n.from_location_id, l.material_id, 0, 0, l.quantity, 0, 0, 0
  from public.delivery_notes n
  join public.delivery_note_material_lines l on l.note_id = n.id
  where n.status in ('sent', 'received')
)
select
  p.id as project_id,
  p.code as project_code,
  p.name as project_name,
  m.id as material_id,
  m.code as material_code,
  m.name as material_name,
  m.unit_code,
  sum(f.received) as received,
  sum(f.transferred_in) as transferred_in,
  sum(f.transferred_out) as transferred_out,
  sum(f.used) as used,
  sum(f.returned) as returned,
  sum(f.shrinkage) as shrinkage,
  coalesce((
    select s.quantity from public.material_stock s
    where s.material_id = m.id and s.location_id = p.location_id
  ), 0) as on_hand
from flows f
join public.projects p on p.location_id = f.location_id
join public.materials m on m.id = f.material_id
where m.ownership = 'client'
group by p.id, p.code, p.name, p.location_id, m.id, m.code, m.name, m.unit_code;

-- ---------------------------------------------------------------------------
-- Daily check (MAT-07)
-- ---------------------------------------------------------------------------
create or replace function public.check_material_min_stock()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in select * from public.material_low_stock
  loop
    perform public.notify_roles(
      array['operations']::public.app_role[],
      'materials',
      'Stok di bawah minimum',
      format('%s di %s: %s %s (minimum %s)', r.code, r.location_name, public.material_qty_label(r.quantity),
        r.unit_code, public.material_qty_label(r.min_stock)),
      '/operations/materials/' || r.material_id,
      format('material-min:%s:%s:%s', r.material_id, r.location_id, public.today_wib())
    );
  end loop;
end;
$$;

revoke execute on function public.check_material_min_stock() from public, anon, authenticated;

insert into public.scheduled_checks (name, function_name, description, sort_order) values
  ('material-min-stock', 'public.check_material_min_stock()',
   'Material milik perusahaan di bawah stok minimum per lokasi (MAT-07)', 60);

-- ---------------------------------------------------------------------------
-- Attachments: receipt documents (nota, surat jalan/BA klien)
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
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Material & stok L L — L — K K(P))
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'materials', 'material_stock', 'material_transactions', 'material_transaction_lines',
    'material_movements', 'delivery_note_material_lines'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
    execute format(
      'create policy "Material readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''finance'', ''operations'')))', t);
  end loop;
end;
$$;

grant update (name, category_id, ownership, min_stock, notes, is_active) on table public.materials to authenticated;

create policy "Operasional edits materials" on public.materials
  for update to authenticated
  using ((select public.has_role('operations')))
  with check ((select public.has_role('operations')));

create policy "Lapangan reads materials" on public.materials
  for select to authenticated
  using ((select public.has_role('field')));

create policy "Lapangan reads material stock at their locations" on public.material_stock
  for select to authenticated
  using ((select public.has_role('field')) and location_id in (select public.user_location_ids()));

create policy "Lapangan reads material transactions at their locations" on public.material_transactions
  for select to authenticated
  using ((select public.has_role('field')) and location_id in (select public.user_location_ids()));

create policy "Lapangan reads material transaction lines" on public.material_transaction_lines
  for select to authenticated
  using ((select public.has_role('field')) and transaction_id in (select t.id from public.material_transactions t));

create policy "Lapangan reads material movements at their locations" on public.material_movements
  for select to authenticated
  using ((select public.has_role('field')) and location_id in (select public.user_location_ids()));

create policy "Lapangan reads material note lines" on public.delivery_note_material_lines
  for select to authenticated
  using ((select public.has_role('field')) and note_id in (select n.id from public.delivery_notes n));

revoke all on table public.material_overview from anon;
revoke all on table public.material_low_stock from anon;
revoke all on table public.material_reconciliation from anon;
