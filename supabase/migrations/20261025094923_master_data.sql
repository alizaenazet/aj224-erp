-- Master data: company profile, suppliers, locations, cost categories,
-- positions & certificates, stage template, item categories, units, system
-- parameters. PRD MST-02 … MST-10 (change: add-master-data).

-- Active user with a role (any role): read access for shared reference data.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_app_role() is not null
$$;

-- ---------------------------------------------------------------------------
-- Company profile (MST-02) — single row
-- ---------------------------------------------------------------------------
create table public.company_profile (
  id boolean primary key default true check (id),
  name text not null check (length(btrim(name)) > 0),
  address text,
  phone text,
  email text,
  npwp text,
  is_pkp boolean not null default false,
  logo_path text,
  updated_at timestamptz not null default now()
);

insert into public.company_profile (name, address) values ('UD. AJ224', 'Lamongan, Jawa Timur');

create trigger company_profile_set_updated_at
before update on public.company_profile
for each row execute function public.set_updated_at();

create trigger company_profile_audit
after update on public.company_profile
for each row execute function public.audit_row_change('id');

create table public.company_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null check (length(btrim(bank_name)) > 0),
  account_number text not null check (length(btrim(account_number)) > 0),
  account_holder text not null check (length(btrim(account_holder)) > 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not (is_default and not is_active))
);

create unique index company_bank_accounts_one_default
  on public.company_bank_accounts (is_default) where is_default;

create trigger company_bank_accounts_set_updated_at
before update on public.company_bank_accounts
for each row execute function public.set_updated_at();

create or replace function public.set_default_bank_account(p_account_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.company_bank_accounts set is_default = false where is_default and id <> p_account_id;
  update public.company_bank_accounts set is_default = true, is_active = true where id = p_account_id;
  if not found then
    raise exception 'Rekening tidak ditemukan';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Suppliers (MST-03)
-- ---------------------------------------------------------------------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  category text not null check (category in
    ('material', 'equipment_rental', 'transport', 'accommodation', 'catering', 'other')),
  contact_name text,
  phone text,
  email text,
  address text,
  npwp text,
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  payment_term_days integer not null default 30 check (payment_term_days between 0 and 365),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index suppliers_name_key on public.suppliers (lower(btrim(name)));

create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Locations (MST-04)
-- ---------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9-]{1,19}$'),
  name text not null check (length(btrim(name)) > 0),
  type text not null check (type in ('warehouse', 'project')),
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

insert into public.locations (code, name, type, address)
values ('GDG-LMG', 'Gudang Lamongan', 'warehouse', 'Lamongan, Jawa Timur');

-- ---------------------------------------------------------------------------
-- Cost categories (MST-05)
-- ---------------------------------------------------------------------------
create table public.cost_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_]{2,20}$'),
  name text not null check (length(btrim(name)) > 0),
  is_overhead boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index cost_categories_name_key on public.cost_categories (lower(btrim(name)));

create trigger cost_categories_set_updated_at
before update on public.cost_categories
for each row execute function public.set_updated_at();

insert into public.cost_categories (code, name, is_overhead, sort_order) values
  ('WAGES',     'Upah & Gaji',                     false, 10),
  ('ACCOM',     'Akomodasi & Konsumsi',            false, 20),
  ('MOBIL',     'Mobilisasi/Demobilisasi',         false, 30),
  ('MATERIAL',  'Material & Consumable',           false, 40),
  ('RENTAL',    'Sewa Alat & Kendaraan',           false, 50),
  ('FUEL',      'BBM & Transportasi',              false, 60),
  ('REPAIR',    'Perbaikan Alat',                  false, 70),
  ('SAFETY',    'K3 & APD',                        false, 80),
  ('TRAINING',  'Pelatihan & Sertifikasi',         false, 90),
  ('PERMIT',    'Perizinan & Sosial (ROW/warga)',  false, 100),
  ('OTHER',     'Lain-lain',                       false, 110),
  ('OVERHEAD',  'Overhead Kantor',                 true,  120);

-- ---------------------------------------------------------------------------
-- Certificate types (MST-07), positions & required certificates (MST-06)
-- ---------------------------------------------------------------------------
create table public.certificate_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  validity_months integer check (validity_months is null or validity_months between 1 and 600),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index certificate_types_name_key on public.certificate_types (lower(btrim(name)));

create trigger certificate_types_set_updated_at
before update on public.certificate_types
for each row execute function public.set_updated_at();

-- Default validities are a starting point; HCM confirms them (PRD §19 Q10).
insert into public.certificate_types (name, validity_months, description) values
  ('TKBT Tingkat 1', 60, 'Bekerja di ketinggian (Tenaga Kerja Bangunan Tinggi) tingkat 1'),
  ('TKBT Tingkat 2', 60, 'Bekerja di ketinggian (Tenaga Kerja Bangunan Tinggi) tingkat 2'),
  ('SKTTK',          36, 'Sertifikat Kompetensi Tenaga Teknik Ketenagalistrikan'),
  ('Ahli K3 Umum',   36, 'Sertifikat Ahli K3 Umum'),
  ('SIO Operator',   60, 'Surat Izin Operator alat berat/angkat'),
  ('P3K',            48, 'Petugas Pertolongan Pertama pada Kecelakaan'),
  ('SIM B1',         60, 'Surat Izin Mengemudi B1');

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index positions_name_key on public.positions (lower(btrim(name)));

create trigger positions_set_updated_at
before update on public.positions
for each row execute function public.set_updated_at();

insert into public.positions (name, sort_order) values
  ('Site Manager', 10), ('Pengawas', 20), ('Mandor', 30), ('Linesman/Pemanjat', 40),
  ('Operator Mesin', 50), ('Helper', 60), ('Driver', 70), ('Safety Officer', 80),
  ('Admin Proyek', 90), ('Staf Kantor', 100);

create table public.position_required_certificates (
  position_id uuid not null references public.positions (id) on delete cascade,
  certificate_type_id uuid not null references public.certificate_types (id) on delete restrict,
  primary key (position_id, certificate_type_id)
);

-- Starting map from common transmission practice; HCM confirms (PRD §19 Q10).
insert into public.position_required_certificates (position_id, certificate_type_id)
select p.id, c.id
from (values
  ('Site Manager', 'SKTTK'),
  ('Pengawas', 'SKTTK'),
  ('Pengawas', 'TKBT Tingkat 1'),
  ('Mandor', 'TKBT Tingkat 1'),
  ('Linesman/Pemanjat', 'TKBT Tingkat 2'),
  ('Operator Mesin', 'SIO Operator'),
  ('Driver', 'SIM B1'),
  ('Safety Officer', 'Ahli K3 Umum'),
  ('Safety Officer', 'P3K')
) as m(position_name, certificate_name)
join public.positions p on p.name = m.position_name
join public.certificate_types c on c.name = m.certificate_name;

-- Replaces a position's required certificates in one transaction (RLS applies).
create or replace function public.set_position_required_certificates(
  p_position_id uuid,
  p_certificate_type_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.position_required_certificates
  where position_id = p_position_id
    and certificate_type_id <> all (coalesce(p_certificate_type_ids, '{}'));

  insert into public.position_required_certificates (position_id, certificate_type_id)
  select p_position_id, unnest(coalesce(p_certificate_type_ids, '{}'))
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stringing stage template (MST-08)
-- ---------------------------------------------------------------------------
create table public.stage_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  default_weight numeric(5, 2) not null check (default_weight > 0 and default_weight <= 100),
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index stage_templates_name_key on public.stage_templates (lower(btrim(name)));

create trigger stage_templates_set_updated_at
before update on public.stage_templates
for each row execute function public.set_updated_at();

insert into public.stage_templates (name, default_weight, sort_order) values
  ('Pemasangan Pulley', 10, 10),
  ('Penarikan Pilot Wire', 10, 20),
  ('Penarikan Konduktor', 30, 30),
  ('Sagging', 15, 40),
  ('Clamping', 15, 50),
  ('Spacer & Damper', 10, 60),
  ('Jumper', 5, 70),
  ('GSW/OPGW', 5, 80);

-- Checked at commit so a multi-row edit can pass through intermediate totals.
create or replace function public.check_stage_template_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  total numeric;
begin
  select coalesce(sum(default_weight), 0) into total
  from public.stage_templates
  where is_active;

  if total <> 100 then
    raise exception 'Total bobot harus 100 (sekarang %)', trim_scale(total);
  end if;
  return null;
end;
$$;

create constraint trigger stage_templates_total
after insert or update or delete on public.stage_templates
deferrable initially deferred
for each row execute function public.check_stage_template_total();

-- Saves the whole template at once: rows with id are updated, rows without
-- id inserted, rows not listed deleted. RLS applies (security invoker).
create or replace function public.save_stage_template(p_stages jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  stage jsonb;
  kept uuid[] := '{}';
  saved_id uuid;
begin
  for stage in select * from jsonb_array_elements(p_stages)
  loop
    if stage ->> 'id' is not null then
      update public.stage_templates
      set name = stage ->> 'name',
          default_weight = (stage ->> 'default_weight')::numeric,
          sort_order = (stage ->> 'sort_order')::integer,
          is_active = (stage ->> 'is_active')::boolean
      where id = (stage ->> 'id')::uuid
      returning id into saved_id;
    else
      insert into public.stage_templates (name, default_weight, sort_order, is_active)
      values (
        stage ->> 'name',
        (stage ->> 'default_weight')::numeric,
        (stage ->> 'sort_order')::integer,
        (stage ->> 'is_active')::boolean
      )
      returning id into saved_id;
    end if;
    kept := kept || saved_id;
  end loop;

  delete from public.stage_templates where id <> all (kept);
end;
$$;

-- ---------------------------------------------------------------------------
-- Tool & material categories, units (MST-09)
-- ---------------------------------------------------------------------------
create table public.item_categories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('tool', 'material')),
  name text not null check (length(btrim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index item_categories_name_key on public.item_categories (kind, lower(btrim(name)));

create trigger item_categories_set_updated_at
before update on public.item_categories
for each row execute function public.set_updated_at();

insert into public.item_categories (kind, name) values
  ('tool', 'Mesin Utama'), ('tool', 'Alat Bantu'), ('tool', 'Alat Ukur'),
  ('tool', 'Kendaraan'), ('tool', 'APD'),
  ('material', 'Konduktor & Kawat'), ('material', 'Insulator'),
  ('material', 'Fitting & Aksesoris'), ('material', 'Consumable');

create table public.units (
  code text primary key check (code ~ '^[a-z0-9]{1,10}$'),
  name text not null check (length(btrim(name)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger units_set_updated_at
before update on public.units
for each row execute function public.set_updated_at();

insert into public.units (code, name) values
  ('m', 'Meter'), ('kg', 'Kilogram'), ('pcs', 'Pcs'), ('set', 'Set'),
  ('drum', 'Drum'), ('liter', 'Liter');

-- ---------------------------------------------------------------------------
-- System parameters (MST-10) — single row, audited
-- ---------------------------------------------------------------------------
create table public.system_parameters (
  id boolean primary key default true check (id),
  backdate_days integer not null default 3 check (backdate_days between 0 and 31),
  cert_expiry_warning_days integer not null default 60 check (cert_expiry_warning_days between 1 and 365),
  health_warning_points numeric(5, 2) not null default 10 check (health_warning_points > 0),
  health_critical_points numeric(5, 2) not null default 20,
  ppn_rate numeric(5, 2) not null default 11 check (ppn_rate between 0 and 100),
  standard_work_hours numeric(4, 2) not null default 8 check (standard_work_hours between 1 and 24),
  monthly_salary_divisor integer not null default 26 check (monthly_salary_divisor between 1 and 31),
  updated_at timestamptz not null default now(),
  check (health_warning_points < health_critical_points)
);

insert into public.system_parameters default values;

create trigger system_parameters_set_updated_at
before update on public.system_parameters
for each row execute function public.set_updated_at();

create trigger system_parameters_audit
after update on public.system_parameters
for each row execute function public.audit_row_change('id');

create trigger document_types_audit
after update on public.document_types
for each row execute function public.audit_row_change('code');

-- ---------------------------------------------------------------------------
-- Row Level Security (PRD §13)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'company_profile', 'company_bank_accounts', 'suppliers', 'locations',
    'cost_categories', 'certificate_types', 'positions',
    'position_required_certificates', 'stage_templates', 'item_categories',
    'units', 'system_parameters'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
  end loop;
end;
$$;

-- Reads: shared reference data for every active user; suppliers restricted.
create policy "Active users read company profile" on public.company_profile
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read bank accounts" on public.company_bank_accounts
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read locations" on public.locations
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read cost categories" on public.cost_categories
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read certificate types" on public.certificate_types
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read positions" on public.positions
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read required certificates" on public.position_required_certificates
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read stage template" on public.stage_templates
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read item categories" on public.item_categories
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read units" on public.units
  for select to authenticated using ((select public.is_active_user()));
create policy "Active users read system parameters" on public.system_parameters
  for select to authenticated using ((select public.is_active_user()));
create policy "Supplier readers" on public.suppliers
  for select to authenticated
  using ((select public.has_role('super_admin', 'director', 'finance', 'operations')));

-- Writes per managing role.
create policy "Super Admin updates company profile" on public.company_profile
  for update to authenticated
  using ((select public.has_role('super_admin')))
  with check ((select public.has_role('super_admin')));

create policy "Super Admin manages bank accounts" on public.company_bank_accounts
  for all to authenticated
  using ((select public.has_role('super_admin')))
  with check ((select public.has_role('super_admin')));

create policy "Super Admin updates system parameters" on public.system_parameters
  for update to authenticated
  using ((select public.has_role('super_admin')))
  with check ((select public.has_role('super_admin')));

create policy "Finance manages suppliers" on public.suppliers
  for all to authenticated
  using ((select public.has_role('super_admin', 'finance')))
  with check ((select public.has_role('super_admin', 'finance')));

create policy "Finance manages cost categories" on public.cost_categories
  for all to authenticated
  using ((select public.has_role('super_admin', 'finance')))
  with check ((select public.has_role('super_admin', 'finance')));

create policy "HCM manages certificate types" on public.certificate_types
  for all to authenticated
  using ((select public.has_role('super_admin', 'hcm')))
  with check ((select public.has_role('super_admin', 'hcm')));

create policy "HCM manages positions" on public.positions
  for all to authenticated
  using ((select public.has_role('super_admin', 'hcm')))
  with check ((select public.has_role('super_admin', 'hcm')));

create policy "HCM manages required certificates" on public.position_required_certificates
  for all to authenticated
  using ((select public.has_role('super_admin', 'hcm')))
  with check ((select public.has_role('super_admin', 'hcm')));

-- Users only create warehouses; project locations come with projects.
create policy "Operasional manages warehouses" on public.locations
  for all to authenticated
  using ((select public.has_role('super_admin', 'operations')))
  with check ((select public.has_role('super_admin', 'operations')) and type = 'warehouse');

create policy "Operasional manages stage template" on public.stage_templates
  for all to authenticated
  using ((select public.has_role('super_admin', 'operations')))
  with check ((select public.has_role('super_admin', 'operations')));

create policy "Operasional manages item categories" on public.item_categories
  for all to authenticated
  using ((select public.has_role('super_admin', 'operations')))
  with check ((select public.has_role('super_admin', 'operations')));

create policy "Operasional manages units" on public.units
  for all to authenticated
  using ((select public.has_role('super_admin', 'operations')))
  with check ((select public.has_role('super_admin', 'operations')));

-- Single-row tables: no client inserts or deletes.
revoke insert, delete on table public.company_profile from authenticated;
revoke insert, delete on table public.system_parameters from authenticated;

-- ---------------------------------------------------------------------------
-- Storage: company logo (private bucket, 1 MB, images only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-assets', 'company-assets', false, 1048576,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Active users read company assets" on storage.objects
  for select to authenticated
  using (bucket_id = 'company-assets' and (select public.is_active_user()));

create policy "Super Admin uploads company assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'company-assets' and (select public.has_role('super_admin')));

create policy "Super Admin updates company assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'company-assets' and (select public.has_role('super_admin')));

create policy "Super Admin deletes company assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'company-assets' and (select public.has_role('super_admin')));
