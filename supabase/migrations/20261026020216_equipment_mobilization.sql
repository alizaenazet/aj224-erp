-- Tools with stock per location and condition, a movement ledger, delivery
-- notes (surat jalan) with receipt confirmation, condition changes and active
-- rentals. PRD ALT-01 … ALT-07 (change: add-equipment-mobilization).

-- ---------------------------------------------------------------------------
-- Tools (ALT-01)
-- ---------------------------------------------------------------------------
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  code text not null check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  category_id uuid not null references public.item_categories (id) on delete restrict,
  tracking text not null check (tracking in ('unit', 'quantity')),
  serial_no text,
  ownership text not null default 'owned' check (ownership in ('owned', 'rented')),
  supplier_id uuid references public.suppliers (id) on delete restrict,
  rental_rate numeric(14, 2) check (rental_rate >= 0),
  rental_period text check (rental_period in ('day', 'month')),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tracking <> 'unit' or length(btrim(coalesce(serial_no, ''))) > 0),
  check (ownership <> 'rented' or (supplier_id is not null and rental_rate is not null and rental_period is not null))
);

create unique index tools_code_key on public.tools (lower(btrim(code)));
create unique index tools_serial_key on public.tools (lower(btrim(serial_no))) where serial_no is not null;

create trigger tools_set_updated_at
before update on public.tools
for each row execute function public.set_updated_at();

create trigger tools_audit
after insert or update on public.tools
for each row execute function public.audit_row_change('id');

create or replace function public.tools_check_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.item_categories where id = new.category_id and kind = 'tool') then
    raise exception 'Kategori harus kategori alat';
  end if;
  return new;
end;
$$;

create trigger tools_check_category
before insert or update of category_id on public.tools
for each row execute function public.tools_check_category();

-- ---------------------------------------------------------------------------
-- Stock per location and condition (ALT-02) and the movement ledger
-- ---------------------------------------------------------------------------
create table public.tool_stock (
  tool_id uuid not null references public.tools (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete restrict,
  condition text not null check (condition in ('good', 'damaged', 'repair', 'lost')),
  quantity integer not null check (quantity > 0),
  primary key (tool_id, location_id, condition)
);

create index tool_stock_location_idx on public.tool_stock (location_id);

-- ---------------------------------------------------------------------------
-- Delivery notes (ALT-03, ALT-04); materials add their own line table later
-- ---------------------------------------------------------------------------
create table public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  from_location_id uuid not null references public.locations (id) on delete restrict,
  to_location_id uuid not null references public.locations (id) on delete restrict,
  note_date date not null,
  vehicle text,
  driver text,
  notes text,
  status text not null default 'sent' check (status in ('sent', 'received', 'cancelled')),
  sent_by uuid references public.profiles (id) on delete set null,
  sent_at timestamptz,
  received_by uuid references public.profiles (id) on delete set null,
  received_at timestamptz,
  receipt_note text,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_location_id <> to_location_id)
);

create index delivery_notes_to_idx on public.delivery_notes (to_location_id, status);
create index delivery_notes_from_idx on public.delivery_notes (from_location_id, status);

create trigger delivery_notes_set_updated_at
before update on public.delivery_notes
for each row execute function public.set_updated_at();

create trigger delivery_notes_audit
after insert or update on public.delivery_notes
for each row execute function public.audit_row_change('id');

create table public.delivery_note_tool_lines (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.delivery_notes (id) on delete cascade,
  tool_id uuid not null references public.tools (id) on delete restrict,
  condition text not null check (condition in ('good', 'damaged', 'repair')),
  quantity integer not null check (quantity > 0),
  received_good integer check (received_good >= 0),
  received_damaged integer check (received_damaged >= 0),
  missing integer check (missing >= 0),
  receipt_note text,
  sort_order integer not null default 0,
  check (received_good is null or received_good + received_damaged + missing = quantity)
);

create index delivery_note_tool_lines_note_idx on public.delivery_note_tool_lines (note_id, sort_order);
create index delivery_note_tool_lines_tool_idx on public.delivery_note_tool_lines (tool_id);

create table public.tool_movements (
  id bigint generated always as identity primary key,
  tool_id uuid not null references public.tools (id) on delete cascade,
  kind text not null check (kind in ('opening', 'send', 'receive', 'shortfall', 'condition', 'adjust', 'cancel')),
  from_location_id uuid references public.locations (id) on delete restrict,
  to_location_id uuid references public.locations (id) on delete restrict,
  from_condition text,
  to_condition text,
  quantity integer not null check (quantity > 0),
  delivery_note_id uuid references public.delivery_notes (id) on delete set null,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);

create index tool_movements_tool_idx on public.tool_movements (tool_id, created_at);

-- ---------------------------------------------------------------------------
-- Scoping and notification helpers
-- ---------------------------------------------------------------------------
create or replace function public.user_location_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.location_id
  from public.projects p
  where p.id in (select public.user_project_ids()) and p.location_id is not null
$$;

-- Notifies the Lapangan accounts of the crew assigned to a project today.
create or replace function public.notify_project_field(
  p_project uuid,
  p_category text,
  p_title text,
  p_body text,
  p_link text,
  p_dedupe text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  for recipient in
    select distinct pr.id
    from public.profiles pr
    join public.assignments a on a.employee_id = pr.employee_id
    where pr.role = 'field'
      and pr.is_active
      and a.project_id = p_project
      and a.start_date <= public.today_wib()
      and (a.end_date is null or a.end_date >= public.today_wib())
  loop
    perform public.notify_user(recipient, p_category, p_title, p_body, p_link, p_dedupe);
  end loop;
end;
$$;

revoke execute on function public.notify_project_field(uuid, text, text, text, text, text) from public, anon, authenticated;

create or replace function public.tool_condition_label(p_condition text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_condition
    when 'good' then 'Baik'
    when 'damaged' then 'Rusak'
    when 'repair' then 'Dalam Perbaikan'
    when 'lost' then 'Hilang'
    else p_condition
  end
$$;

-- Internal: changes one stock cell, never below zero.
create or replace function public.tool_stock_change(p_tool uuid, p_location uuid, p_condition text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  available integer;
  tool_code text;
  location_name text;
begin
  if p_delta = 0 then
    return;
  end if;
  select quantity into available
  from public.tool_stock
  where tool_id = p_tool and location_id = p_location and condition = p_condition
  for update;

  if coalesce(available, 0) + p_delta < 0 then
    select code into tool_code from public.tools where id = p_tool;
    select name into location_name from public.locations where id = p_location;
    raise exception 'Stok % di % (%) tidak cukup: tersedia %',
      tool_code, location_name, public.tool_condition_label(p_condition), coalesce(available, 0);
  end if;

  if available is null then
    insert into public.tool_stock (tool_id, location_id, condition, quantity)
    values (p_tool, p_location, p_condition, p_delta);
  elsif available + p_delta = 0 then
    delete from public.tool_stock
    where tool_id = p_tool and location_id = p_location and condition = p_condition;
  else
    update public.tool_stock
    set quantity = available + p_delta
    where tool_id = p_tool and location_id = p_location and condition = p_condition;
  end if;
end;
$$;

revoke execute on function public.tool_stock_change(uuid, uuid, text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tool functions (ALT-01, ALT-05, ALT-02 adjustments)
-- p_tool: { code, name, category_id, tracking, serial_no, ownership,
--   supplier_id, rental_rate, rental_period, notes }
-- ---------------------------------------------------------------------------
create or replace function public.create_tool(p_tool jsonb, p_location uuid, p_condition text, p_quantity integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  tracking text := p_tool ->> 'tracking';
  ownership text := coalesce(p_tool ->> 'ownership', 'owned');
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if p_condition not in ('good', 'damaged', 'repair') then
    raise exception 'Kondisi awal tidak valid';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Jumlah awal minimal 1';
  end if;
  if tracking = 'unit' and p_quantity <> 1 then
    raise exception 'Alat Per Unit selalu berjumlah 1';
  end if;
  if not exists (select 1 from public.locations where id = p_location and is_active) then
    raise exception 'Lokasi tidak valid';
  end if;

  insert into public.tools (
    code, name, category_id, tracking, serial_no, ownership, supplier_id, rental_rate, rental_period, notes
  ) values (
    btrim(p_tool ->> 'code'),
    btrim(p_tool ->> 'name'),
    (p_tool ->> 'category_id')::uuid,
    tracking,
    nullif(btrim(p_tool ->> 'serial_no'), ''),
    ownership,
    case when ownership = 'rented' then (p_tool ->> 'supplier_id')::uuid end,
    case when ownership = 'rented' then (p_tool ->> 'rental_rate')::numeric end,
    case when ownership = 'rented' then p_tool ->> 'rental_period' end,
    nullif(btrim(p_tool ->> 'notes'), '')
  )
  returning id into new_id;

  perform public.tool_stock_change(new_id, p_location, p_condition, p_quantity);
  insert into public.tool_movements (tool_id, kind, to_location_id, to_condition, quantity, note, created_by)
  values (new_id, 'opening', p_location, p_condition, p_quantity, 'Saldo awal', auth.uid());
  return new_id;
end;
$$;

create or replace function public.change_tool_condition(
  p_tool uuid,
  p_location uuid,
  p_from text,
  p_to text,
  p_quantity integer,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.has_role('operations')
          or (public.has_role('field') and p_location in (select public.user_location_ids()))) then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if p_from = p_to or p_from not in ('good', 'damaged', 'repair', 'lost') or p_to not in ('good', 'damaged', 'repair', 'lost') then
    raise exception 'Perubahan kondisi tidak valid';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Jumlah minimal 1';
  end if;
  if length(btrim(coalesce(p_note, ''))) = 0 then
    raise exception 'Isi catatan perubahan kondisi';
  end if;

  perform public.tool_stock_change(p_tool, p_location, p_from, -p_quantity);
  perform public.tool_stock_change(p_tool, p_location, p_to, p_quantity);
  insert into public.tool_movements (
    tool_id, kind, from_location_id, to_location_id, from_condition, to_condition, quantity, note, created_by
  ) values (p_tool, 'condition', p_location, p_location, p_from, p_to, p_quantity, btrim(p_note), auth.uid());
end;
$$;

create or replace function public.adjust_tool_stock(
  p_tool uuid,
  p_location uuid,
  p_condition text,
  p_delta integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  tool record;
  total integer;
begin
  if not public.has_role('operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'Isi jumlah penyesuaian';
  end if;
  if p_condition not in ('good', 'damaged', 'repair', 'lost') then
    raise exception 'Kondisi tidak valid';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Isi alasan penyesuaian';
  end if;
  select id, code, tracking into tool from public.tools where id = p_tool;
  if not found then
    raise exception 'Alat tidak ditemukan';
  end if;

  perform public.tool_stock_change(p_tool, p_location, p_condition, p_delta);

  if tool.tracking = 'unit' then
    select coalesce(sum(quantity), 0) into total from public.tool_stock where tool_id = p_tool;
    total := total + coalesce((
      select sum(l.quantity) from public.delivery_note_tool_lines l
      join public.delivery_notes n on n.id = l.note_id
      where l.tool_id = p_tool and n.status = 'sent'
    ), 0);
    if total > 1 then
      raise exception 'Alat Per Unit % tidak boleh lebih dari 1', tool.code;
    end if;
  end if;

  insert into public.tool_movements (
    tool_id, kind, from_location_id, to_location_id, from_condition, to_condition, quantity, note, created_by
  ) values (
    p_tool, 'adjust',
    case when p_delta < 0 then p_location end,
    case when p_delta > 0 then p_location end,
    case when p_delta < 0 then p_condition end,
    case when p_delta > 0 then p_condition end,
    abs(p_delta), btrim(p_reason), auth.uid()
  );

  insert into public.audit_log (table_name, record_id, action, actor_id, new_values, reason)
  values (
    'tools', p_tool::text, 'update', auth.uid(),
    jsonb_build_object(
      'stock_adjustment', format('%s%s %s di %s', case when p_delta > 0 then '+' else '' end, p_delta,
        public.tool_condition_label(p_condition), (select name from public.locations where id = p_location))
    ),
    btrim(p_reason)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Delivery note functions (ALT-03, ALT-04)
-- p_note: { from_location_id, to_location_id, note_date, vehicle, driver, notes }
-- p_lines: [{ tool_id, condition, quantity }]
-- ---------------------------------------------------------------------------
create or replace function public.send_delivery_note(p_note jsonb, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  from_location uuid := (p_note ->> 'from_location_id')::uuid;
  to_location uuid := (p_note ->> 'to_location_id')::uuid;
  dated date := coalesce((p_note ->> 'note_date')::date, public.today_wib());
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
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then
    raise exception 'Tambahkan minimal satu alat';
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
    from jsonb_array_elements(p_lines) with ordinality as e(item, ord)
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

  select p.id, p.code into destination_project from public.projects p where p.location_id = to_location;
  if found then
    perform public.notify_project_field(
      destination_project.id,
      'equipment',
      'Alat dikirim ke proyek',
      format('%s · %s · konfirmasi saat diterima', note_number, destination_project.code),
      '/operations/delivery-notes/' || new_note_id,
      'delivery-sent:' || new_note_id
    );
  end if;
  return new_note_id;
end;
$$;

-- p_lines: [{ line_id, received_good, received_damaged, receipt_note }]
create or replace function public.receive_delivery_note(p_note uuid, p_lines jsonb, p_receipt_note text)
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
    'public.create_tool(jsonb, uuid, text, integer)',
    'public.change_tool_condition(uuid, uuid, text, text, integer, text)',
    'public.adjust_tool_stock(uuid, uuid, text, integer, text)',
    'public.send_delivery_note(jsonb, jsonb)',
    'public.receive_delivery_note(uuid, jsonb, text)',
    'public.cancel_delivery_note(uuid, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Views (ALT-02, ALT-06, ALT-07)
-- ---------------------------------------------------------------------------
create view public.tool_overview
with (security_invoker = true)
as
select
  t.id,
  t.code,
  t.name,
  t.category_id,
  c.name as category_name,
  t.tracking,
  t.serial_no,
  t.ownership,
  t.supplier_id,
  s.name as supplier_name,
  t.rental_rate,
  t.rental_period,
  t.notes,
  t.is_active,
  coalesce(st.good, 0)::int as good,
  coalesce(st.damaged, 0)::int as damaged,
  coalesce(st.repair, 0)::int as repair,
  coalesce(st.lost, 0)::int as lost,
  coalesce(tr.in_transit, 0)::int as in_transit,
  (coalesce(st.total, 0) + coalesce(tr.in_transit, 0))::int as total
from public.tools t
join public.item_categories c on c.id = t.category_id
left join public.suppliers s on s.id = t.supplier_id
left join lateral (
  select
    sum(quantity) filter (where condition = 'good') as good,
    sum(quantity) filter (where condition = 'damaged') as damaged,
    sum(quantity) filter (where condition = 'repair') as repair,
    sum(quantity) filter (where condition = 'lost') as lost,
    sum(quantity) as total
  from public.tool_stock where tool_id = t.id
) st on true
left join lateral (
  select sum(l.quantity) as in_transit
  from public.delivery_note_tool_lines l
  join public.delivery_notes n on n.id = l.note_id
  where l.tool_id = t.id and n.status = 'sent'
) tr on true;

-- ALT-06: each stay of a Per Unit tool at a location.
create view public.tool_stays
with (security_invoker = true)
as
select
  m.tool_id,
  m.to_location_id as location_id,
  l.name as location_name,
  l.type as location_type,
  m.created_at as start_at,
  leave.created_at as end_at,
  ((coalesce(leave.created_at, now()) at time zone 'Asia/Jakarta')::date
   - (m.created_at at time zone 'Asia/Jakarta')::date)::int as days
from public.tool_movements m
join public.tools t on t.id = m.tool_id and t.tracking = 'unit'
join public.locations l on l.id = m.to_location_id
left join lateral (
  select x.created_at
  from public.tool_movements x
  where x.tool_id = m.tool_id
    and x.kind = 'send'
    and x.from_location_id = m.to_location_id
    and x.created_at > m.created_at
  order by x.created_at
  limit 1
) leave on true
where m.kind in ('opening', 'receive', 'cancel')
  and m.to_condition <> 'lost';

-- ALT-07: rented tools on project locations with the estimated running cost.
create view public.active_rentals
with (security_invoker = true)
as
select
  t.id as tool_id,
  t.code,
  t.name,
  s.name as supplier_name,
  t.rental_rate,
  t.rental_period,
  p.id as project_id,
  p.code as project_code,
  st.quantity,
  since.arrived_at,
  ((now() at time zone 'Asia/Jakarta')::date - (since.arrived_at at time zone 'Asia/Jakarta')::date)::int as days,
  case t.rental_period
    when 'day' then t.rental_rate * st.quantity
         * ((now() at time zone 'Asia/Jakarta')::date - (since.arrived_at at time zone 'Asia/Jakarta')::date)
    else t.rental_rate * st.quantity
         * ceil(((now() at time zone 'Asia/Jakarta')::date - (since.arrived_at at time zone 'Asia/Jakarta')::date) / 30.0)
  end as estimated_cost
from public.tools t
join public.suppliers s on s.id = t.supplier_id
join lateral (
  select location_id, sum(quantity)::int as quantity
  from public.tool_stock
  where tool_id = t.id and condition <> 'lost'
  group by location_id
) st on true
join public.projects p on p.location_id = st.location_id
join lateral (
  select max(m.created_at) as arrived_at
  from public.tool_movements m
  where m.tool_id = t.id and m.to_location_id = st.location_id and m.kind in ('opening', 'receive')
) since on true
where t.ownership = 'rented';

-- ---------------------------------------------------------------------------
-- Attachments: tool photos, condition photos, receipt photos
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
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13: Alat & surat jalan L L — L — K K(P))
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['tools', 'tool_stock', 'tool_movements', 'delivery_notes', 'delivery_note_tool_lines']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('revoke insert, update, delete on table public.%I from authenticated', t);
    execute format(
      'create policy "Equipment readers" on public.%I for select to authenticated '
      'using ((select public.has_role(''super_admin'', ''director'', ''finance'', ''operations'')))', t);
  end loop;
end;
$$;

grant update (name, category_id, serial_no, ownership, supplier_id, rental_rate, rental_period, notes, is_active)
  on table public.tools to authenticated;

create policy "Operasional edits tools" on public.tools
  for update to authenticated
  using ((select public.has_role('operations')))
  with check ((select public.has_role('operations')));

create policy "Lapangan reads stock at their locations" on public.tool_stock
  for select to authenticated
  using ((select public.has_role('field')) and location_id in (select public.user_location_ids()));

create policy "Lapangan reads movements at their locations" on public.tool_movements
  for select to authenticated
  using (
    (select public.has_role('field'))
    and (from_location_id in (select public.user_location_ids()) or to_location_id in (select public.user_location_ids()))
  );

create policy "Lapangan reads notes of their locations" on public.delivery_notes
  for select to authenticated
  using (
    (select public.has_role('field'))
    and (from_location_id in (select public.user_location_ids()) or to_location_id in (select public.user_location_ids()))
  );

create policy "Lapangan reads note lines of their locations" on public.delivery_note_tool_lines
  for select to authenticated
  using ((select public.has_role('field')) and note_id in (select n.id from public.delivery_notes n));

create policy "Lapangan reads tools at their locations" on public.tools
  for select to authenticated
  using (
    (select public.has_role('field'))
    and (
      id in (select s.tool_id from public.tool_stock s)
      or id in (select l.tool_id from public.delivery_note_tool_lines l)
    )
  );

revoke all on table public.tool_overview from anon;
revoke all on table public.tool_stays from anon;
revoke all on table public.active_rentals from anon;
revoke execute on function public.user_location_ids() from public, anon;
grant execute on function public.user_location_ids() to authenticated;
