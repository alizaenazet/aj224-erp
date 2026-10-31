-- Local development seed. Applied by `supabase db reset` / first `supabase start`.
-- Never run against Staging or Production.

-- ---------------------------------------------------------------------------
-- Dev users: one per role, for manual checks. All share the local-only
-- password below; sign in at http://localhost:3000/auth/login.
--
--   superadmin@aj224.test   Super Admin
--   direktur@aj224.test     Direktur
--   marketing@aj224.test    Marketing
--   finance@aj224.test      Finance
--   hcm@aj224.test          HCM
--   operasional@aj224.test  Operasional
--   lapangan@aj224.test     Lapangan
--
-- Password: XoeaMqu92fwT
-- ---------------------------------------------------------------------------

with dev_users (id, email) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'superadmin@aj224.test'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'direktur@aj224.test'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'marketing@aj224.test'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'finance@aj224.test'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'hcm@aj224.test'),
    ('00000000-0000-4000-8000-000000000006'::uuid, 'operasional@aj224.test'),
    ('00000000-0000-4000-8000-000000000007'::uuid, 'lapangan@aj224.test')
),
inserted as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
    extensions.crypt('XoeaMqu92fwT', extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(),
    '', '', '', ''
  from dev_users
  returning id, email
)
insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
from inserted;

-- Profiles (role per dev user) — setup-access-control
insert into public.profiles (id, full_name, email, role)
values
  ('00000000-0000-4000-8000-000000000001', 'Sinta Admin',       'superadmin@aj224.test',  'super_admin'),
  ('00000000-0000-4000-8000-000000000002', 'Darmawan Direktur', 'direktur@aj224.test',    'director'),
  ('00000000-0000-4000-8000-000000000003', 'Maya Marketing',    'marketing@aj224.test',   'marketing'),
  ('00000000-0000-4000-8000-000000000004', 'Fajar Finance',     'finance@aj224.test',     'finance'),
  ('00000000-0000-4000-8000-000000000005', 'Hana HCM',          'hcm@aj224.test',         'hcm'),
  ('00000000-0000-4000-8000-000000000006', 'Oki Operasional',   'operasional@aj224.test', 'operations'),
  ('00000000-0000-4000-8000-000000000007', 'Lukman Lapangan',   'lapangan@aj224.test',    'field');

-- Employees, pay settings and account links (dev) — add-employee-records
insert into public.employees (
  id, employee_no, full_name, nik_ktp, birth_place, birth_date, address, phone,
  emergency_contact_name, emergency_contact_phone, blood_type, employment_status,
  work_type, position_id, join_date, exit_date, bank_name, bank_account_number,
  bank_account_holder, bpjs_number
)
select
  v.id::uuid, v.employee_no, v.full_name, v.nik_ktp, v.birth_place, v.birth_date::date,
  v.address, v.phone, v.emergency_name, v.emergency_phone, v.blood_type, v.employment_status,
  v.work_type, p.id, v.join_date::date, v.exit_date::date, v.bank_name, v.account_number,
  v.full_name, v.bpjs
from (values
  ('10000000-0000-4000-8000-000000000001', 'AJ-0001', 'Maya Lestari',     '3524014503900001', 'Lamongan',  '1990-03-05', 'Jl. Veteran 12, Lamongan',        '0812-3001-0001', 'Rudi Lestari',  '0812-3001-1001', 'A',  'permanent', 'office', 'Staf Kantor',       '2021-03-01', null,         'BRI',     '0021-01-000101-50-1', '0001234501'),
  ('10000000-0000-4000-8000-000000000002', 'AJ-0002', 'Fajar Nugroho',    '3524011207880002', 'Gresik',    '1988-07-12', 'Jl. Sunan Giri 4, Gresik',        '0812-3001-0002', 'Ani Nugroho',   '0812-3001-1002', 'O',  'permanent', 'office', 'Staf Kantor',       '2020-01-06', null,         'BCA',     '1880-2201-02',        '0001234502'),
  ('10000000-0000-4000-8000-000000000003', 'AJ-0003', 'Hana Pratiwi',     '3524015809920003', 'Lamongan',  '1992-09-18', 'Jl. Kombespol M. Duryat 8',       '0812-3001-0003', 'Budi Pratama',  '0812-3001-1003', 'B',  'permanent', 'office', 'Staf Kantor',       '2022-02-14', null,         'Mandiri', '142-00-1122003-3',    '0001234503'),
  ('10000000-0000-4000-8000-000000000004', 'AJ-0004', 'Oki Setiawan',     '3524010304850004', 'Tuban',     '1985-04-03', 'Jl. Basuki Rahmat 21, Tuban',     '0812-3001-0004', 'Dewi Setiawan', '0812-3001-1004', 'AB', 'permanent', 'office', 'Site Manager',      '2019-05-20', null,         'BRI',     '0021-01-000104-50-4', '0001234504'),
  ('10000000-0000-4000-8000-000000000005', 'AJ-0005', 'Sari Wulandari',   '3524016611950005', 'Lamongan',  '1995-11-26', 'Desa Sumberejo, Lamongan',        '0812-3001-0005', 'Agung Wibowo',  '0812-3001-1005', 'A',  'contract',  'office', 'Admin Proyek',      '2024-07-01', null,         'BRI',     '0021-01-000105-50-5', null),
  ('10000000-0000-4000-8000-000000000102', 'AJ-0102', 'Lukman Hakim',     '3524012002870102', 'Lamongan',  '1987-02-20', 'Desa Kemlagi, Lamongan',          '0813-3002-0102', 'Siti Hakim',    '0813-3002-1102', 'O',  'contract',  'field',  'Mandor',            '2021-08-02', null,         'BRI',     '0021-01-000202-50-2', '0001234602'),
  ('10000000-0000-4000-8000-000000000103', 'AJ-0103', 'Budi Santoso',     '3524011510900103', 'Bojonegoro','1990-10-15', 'Desa Kalitidu, Bojonegoro',       '0813-3002-0103', 'Rina Santoso',  '0813-3002-1103', 'A',  'contract',  'field',  'Linesman/Pemanjat', '2022-03-07', null,         'BRI',     '0021-01-000203-50-3', '0001234603'),
  ('10000000-0000-4000-8000-000000000104', 'AJ-0104', 'Slamet Riyadi',    '3524010801930104', 'Lamongan',  '1993-01-08', 'Desa Brondong, Lamongan',         '0813-3002-0104', 'Wati Riyadi',   '0813-3002-1104', 'B',  'daily',     'field',  'Linesman/Pemanjat', '2023-06-12', null,         'BRI',     '0021-01-000204-50-4', null),
  ('10000000-0000-4000-8000-000000000105', 'AJ-0105', 'Joko Susilo',      '3524012705890105', 'Tuban',     '1989-05-27', 'Desa Jenu, Tuban',                '0813-3002-0105', 'Lilis Susilo',  '0813-3002-1105', 'O',  'contract',  'field',  'Operator Mesin',    '2021-11-01', null,         'Mandiri', '142-00-1122105-5',    '0001234605'),
  ('10000000-0000-4000-8000-000000000106', 'AJ-0106', 'Rudi Hartono',     '3524011904980106', 'Lamongan',  '1998-04-19', 'Desa Paciran, Lamongan',          '0813-3002-0106', 'Sumi Hartono',  '0813-3002-1106', null, 'daily',     'field',  'Helper',            '2025-01-13', null,         null,      null,                  null),
  ('10000000-0000-4000-8000-000000000107', 'AJ-0107', 'Dedi Kurniawan',   '3524010209990107', 'Lamongan',  '1999-09-02', 'Desa Solokuro, Lamongan',         '0813-3002-0107', 'Ida Kurniawan', '0813-3002-1107', 'A',  'daily',     'field',  'Helper',            '2025-04-21', null,         'BRI',     '0021-01-000207-50-7', null),
  ('10000000-0000-4000-8000-000000000108', 'AJ-0108', 'Andi Wijaya',      '3524013112910108', 'Gresik',    '1991-12-31', 'Desa Manyar, Gresik',             '0813-3002-0108', 'Nur Wijaya',    '0813-3002-1108', 'B',  'contract',  'field',  'Driver',            '2022-09-05', null,         'BCA',     '1880-2201-08',        '0001234608'),
  ('10000000-0000-4000-8000-000000000109', 'AJ-0109', 'Eko Prasetyo',     '3524010606860109', 'Lamongan',  '1986-06-06', 'Jl. Lamongrejo 30, Lamongan',     '0813-3002-0109', 'Yuli Prasetyo', '0813-3002-1109', 'O',  'permanent', 'field',  'Safety Officer',    '2020-10-01', null,         'BRI',     '0021-01-000209-50-9', '0001234609'),
  ('10000000-0000-4000-8000-000000000110', 'AJ-0110', 'Wahyu Hidayat',    '3524011403970110', 'Lamongan',  '1997-03-14', 'Desa Karanggeneng, Lamongan',     '0813-3002-0110', 'Asih Hidayat',  '0813-3002-1110', null, 'daily',     'field',  'Helper',            '2024-02-05', '2026-08-31', null,      null,                  null)
) as v(
  id, employee_no, full_name, nik_ktp, birth_place, birth_date, address, phone,
  emergency_name, emergency_phone, blood_type, employment_status, work_type, position,
  join_date, exit_date, bank_name, account_number, bpjs
)
join public.positions p on p.name = v.position;

insert into public.employee_pay_settings (
  employee_id, pay_type, daily_wage, base_salary, fixed_allowance,
  meal_allowance_per_day, field_allowance_per_day, overtime_rate_per_hour, fixed_deduction
)
values
  ('10000000-0000-4000-8000-000000000001', 'monthly', null,   5500000, 500000, 20000,     0, 30000, 150000),
  ('10000000-0000-4000-8000-000000000002', 'monthly', null,   6000000, 500000, 20000,     0, 30000, 150000),
  ('10000000-0000-4000-8000-000000000003', 'monthly', null,   5500000, 500000, 20000,     0, 30000, 150000),
  ('10000000-0000-4000-8000-000000000004', 'monthly', null,   8500000, 1000000, 25000, 50000, 40000, 200000),
  ('10000000-0000-4000-8000-000000000005', 'monthly', null,   4500000, 300000, 20000,     0, 25000, 120000),
  ('10000000-0000-4000-8000-000000000102', 'daily',   200000, null,          0, 25000, 40000, 30000, 100000),
  ('10000000-0000-4000-8000-000000000103', 'daily',   175000, null,          0, 25000, 35000, 25000, 100000),
  ('10000000-0000-4000-8000-000000000104', 'daily',   160000, null,          0, 25000, 35000, 25000,      0),
  ('10000000-0000-4000-8000-000000000105', 'daily',   180000, null,          0, 25000, 30000, 25000, 100000),
  ('10000000-0000-4000-8000-000000000106', 'daily',   130000, null,          0, 25000, 25000, 20000,      0),
  ('10000000-0000-4000-8000-000000000108', 'daily',   150000, null,          0, 25000, 30000, 20000, 100000),
  ('10000000-0000-4000-8000-000000000109', 'monthly', null,   6500000, 750000, 25000, 40000, 35000, 150000);

update public.profiles p
set employee_id = v.employee_id::uuid
from (values
  ('00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000004'),
  ('00000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000102')
) as v(profile_id, employee_id)
where p.id = v.profile_id::uuid;

-- Certificates and a training (dev; dates relative to the reset day) — add-certifications-training
insert into public.employee_certificates (
  employee_id, certificate_type_id, certificate_no, issuer, issued_date, expiry_date
)
select
  e.id, t.id, v.certificate_no, v.issuer,
  public.today_wib() + v.issued_offset,
  public.today_wib() + v.expiry_offset
from (values
  ('AJ-0004', 'SKTTK',          'SKTTK/2024/00412', 'LSP Ketenagalistrikan',       -600,   495),
  ('AJ-0102', 'TKBT Tingkat 1', 'TKBT1/2021/1188',  'PT Sertifikasi K3 Nusantara', -1795,  30),
  ('AJ-0103', 'TKBT Tingkat 2', 'TKBT2/2020/0931',  'PT Sertifikasi K3 Nusantara', -2026, -200),
  ('AJ-0104', 'TKBT Tingkat 2', 'TKBT2/2021/1502',  'PT Sertifikasi K3 Nusantara', -1840, -15),
  ('AJ-0105', 'SIO Operator',   'SIO/2021/7781',    'Disnaker Jawa Timur',         -1780,  45),
  ('AJ-0109', 'Ahli K3 Umum',   'AK3U/2025/0210',   'Kemnaker RI',                 -400,   695),
  ('AJ-0109', 'P3K',            'P3K/2022/3310',    'PMI Lamongan',                -1465, -5),
  ('AJ-0107', 'TKBT Tingkat 1', 'TKBT1/2025/0077',  'PT Sertifikasi K3 Nusantara', -200,   1625)
) as v(employee_no, type_name, certificate_no, issuer, issued_offset, expiry_offset)
join public.employees e on e.employee_no = v.employee_no
join public.certificate_types t on t.name = v.type_name;

insert into public.trainings (id, name, kind, organizer, start_date, end_date, location, certificate_type_id)
select
  '20000000-0000-4000-8000-000000000001', 'Pelatihan TKBT Tingkat 2 Angkatan September', 'external',
  'PT Sertifikasi K3 Nusantara', public.today_wib() - 40, public.today_wib() - 38, 'Surabaya', t.id
from public.certificate_types t
where t.name = 'TKBT Tingkat 2';

-- Budi passes (the trigger issues his renewed certificate); Slamet fails.
insert into public.training_participants (training_id, employee_id, result)
select '20000000-0000-4000-8000-000000000001', e.id, v.result
from (values ('AJ-0103', 'passed'), ('AJ-0104', 'failed')) as v(employee_no, result)
join public.employees e on e.employee_no = v.employee_no;

-- Clients, contacts, tenders and activities (dev; dates relative to the reset day) — add-clients-tenders
insert into public.clients (id, name, kind, address, npwp, payment_term_days, notes) values
  ('40000000-0000-4000-8000-000000000001', 'PT PLN (Persero) UIP Jawa Bagian Timur', 'pln', 'Jl. Ketintang Baru 1, Surabaya', '01.001.629.3-051.000', 30, 'Pemilik proyek transmisi Jawa Timur.'),
  ('40000000-0000-4000-8000-000000000002', 'PT Rekayasa Jaringan Energi', 'epc', 'Jl. TB Simatupang 18, Jakarta Selatan', '02.345.678.9-012.000', 45, null),
  ('40000000-0000-4000-8000-000000000003', 'PT Karya Konstruksi Negara (Persero)', 'bumn', 'Jl. MT Haryono 22, Jakarta Timur', '01.234.567.8-091.000', 60, null),
  ('40000000-0000-4000-8000-000000000004', 'PT Daya Prima Sejahtera', 'private', 'Kawasan Industri Gresik Blok C-7, Gresik', '03.456.789.0-641.000', 30, 'Pemilik jaringan kawasan industri.'),
  ('40000000-0000-4000-8000-000000000005', 'PT Wahana Kelistrikan Indonesia', 'epc', 'Jl. Soekarno-Hatta 410, Bandung', '02.987.654.3-423.000', 45, null),
  ('40000000-0000-4000-8000-000000000006', 'PT PLN (Persero) UIP Kalimantan Bagian Timur', 'pln', 'Jl. MT Haryono 384, Balikpapan', '01.001.629.3-721.000', 30, null);

insert into public.client_contacts (client_id, name, position, phone, email) values
  ('40000000-0000-4000-8000-000000000001', 'Ir. Hendra Wijaya', 'Manajer Pengadaan', '0811-3300-1201', 'hendra.wijaya@contoh-uip.test'),
  ('40000000-0000-4000-8000-000000000001', 'Rina Kusuma', 'Staf Konstruksi', '0812-3300-1202', 'rina.kusuma@contoh-uip.test'),
  ('40000000-0000-4000-8000-000000000002', 'Budi Hartanto', 'Project Manager', '0813-1100-2201', 'budi.hartanto@contoh-epc.test'),
  ('40000000-0000-4000-8000-000000000003', 'Agus Priyanto', 'Kepala Divisi Engineering', '0812-1500-3301', 'agus.priyanto@contoh-bumn.test'),
  ('40000000-0000-4000-8000-000000000004', 'Linda Sari', 'Procurement', '0812-3100-4401', 'linda.sari@contoh-industri.test'),
  ('40000000-0000-4000-8000-000000000005', 'Dedi Supriadi', 'Site Engineer', '0813-2200-5501', null),
  ('40000000-0000-4000-8000-000000000006', 'Yusuf Rahman', 'Manajer Proyek', '0811-5400-6601', 'yusuf.rahman@contoh-uip.test');

insert into public.tenders (
  id, name, client_id, end_owner, location, voltage_kv, length_kms, tower_count, scope,
  info_date, bid_deadline, bid_value, estimated_cost, pic_id, win_probability, status,
  closed_date, lost_reason, winner_name, winner_price
)
select
  v.id::uuid, v.name, v.client_id::uuid, v.end_owner, v.location, v.voltage_kv, v.length_kms, v.tower_count, v.scope,
  public.today_wib() + v.info_offset, public.today_wib() + v.deadline_offset, v.bid_value, v.estimated_cost,
  '00000000-0000-4000-8000-000000000003', v.win_probability, v.status,
  public.today_wib() + v.closed_offset, v.lost_reason, v.winner_name, v.winner_price
from (values
  ('50000000-0000-4000-8000-000000000001', 'Pembangunan SUTT 150 kV Lamongan – Babat', '40000000-0000-4000-8000-000000000001', 'PLN UIP JBTB', 'Lamongan, Jawa Timur', 150, 28.5, 92, 'Pondasi, erection, stringing', -20, 3, 12900000000, 10625000000, 40, 'preparing', null::int, null, null, null::numeric),
  ('50000000-0000-4000-8000-000000000002', 'Stringing SUTET 500 kV Ungaran – Pedan Seksi 3', '40000000-0000-4000-8000-000000000002', 'PLN UIP JBT', 'Klaten, Jawa Tengah', 500, 42, 110, 'Stringing dan pemasangan aksesoris', -10, 1, 18000000000, 15300000000, 25, 'prospect', null, null, null, null),
  ('50000000-0000-4000-8000-000000000003', 'Reconductoring SUTT 150 kV Gresik – Manyar', '40000000-0000-4000-8000-000000000004', 'PT Daya Prima Sejahtera', 'Gresik, Jawa Timur', 150, 12, 38, 'Penggantian konduktor HTLS', -30, 5, 6400000000, 5500000000, 50, 'submitted', null, null, null, null),
  ('50000000-0000-4000-8000-000000000004', 'Stringing SUTET 275 kV Sangatta – Muara Wahau', '40000000-0000-4000-8000-000000000006', 'PLN UIP KLT', 'Kutai Timur, Kalimantan Timur', 275, 65, 160, 'Stringing', -60, -10, 8000000000, 6900000000, 40, 'negotiation', null, null, null, null),
  ('50000000-0000-4000-8000-000000000005', 'Perbaikan Tower SUTT 150 kV Tuban (Emergency)', '40000000-0000-4000-8000-000000000003', 'PLN UIT JBM', 'Tuban, Jawa Timur', 150, 3, 6, 'Perbaikan tower roboh', -15, -5, 2000000000, 1700000000, 50, 'negotiation', null, null, null, null),
  ('50000000-0000-4000-8000-000000000006', 'Stringing SUTT 150 kV Kediri – Pare', '40000000-0000-4000-8000-000000000001', 'PLN UIP JBTB', 'Kediri, Jawa Timur', 150, 22, 70, 'Stringing', -120, -90, 10000000000, 8700000000, 60, 'won', -60, null, null, null),
  ('50000000-0000-4000-8000-000000000007', 'Pembangunan SUTET 500 kV Paiton – Grati Seksi 2', '40000000-0000-4000-8000-000000000002', 'PLN UIP JBTB', 'Probolinggo, Jawa Timur', 500, 18, 45, 'Erection dan stringing', -90, -50, 6000000000, 5200000000, 50, 'won', -30, null, null, null),
  ('50000000-0000-4000-8000-000000000008', 'SUTT 150 kV Bojonegoro – Cepu', '40000000-0000-4000-8000-000000000003', 'PLN UIP JBTB', 'Bojonegoro, Jawa Timur', 150, 30, 95, 'Pondasi, erection, stringing', -100, -70, 4000000000, 3500000000, 30, 'lost', -45, 'price', 'PT Kompetitor Jaya', 3700000000),
  ('50000000-0000-4000-8000-000000000009', 'Uprating SUTT 150 kV Ngimbang', '40000000-0000-4000-8000-000000000004', 'PT Daya Prima Sejahtera', 'Lamongan, Jawa Timur', 150, 8, 24, 'Uprating', -40, -25, null, null, null, 'cancelled', -20, null, null, null)
) as v(id, name, client_id, end_owner, location, voltage_kv, length_kms, tower_count, scope, info_offset,
       deadline_offset, bid_value, estimated_cost, win_probability, status, closed_offset, lost_reason,
       winner_name, winner_price);

-- Closed last year (analytics period check).
insert into public.tenders (
  id, name, client_id, end_owner, location, voltage_kv, length_kms, tower_count, info_date, bid_deadline,
  bid_value, estimated_cost, pic_id, win_probability, status, closed_date, lost_reason
) values
  ('50000000-0000-4000-8000-000000000010', 'SUTT 150 kV Mojokerto – Ngoro', '40000000-0000-4000-8000-000000000005', 'PLN UIP JBTB', 'Mojokerto, Jawa Timur', 150, 16, 50,
   make_date(extract(year from public.today_wib())::int - 1, 6, 1), make_date(extract(year from public.today_wib())::int - 1, 7, 1),
   7500000000, 6600000000, '00000000-0000-4000-8000-000000000003', 35, 'lost', make_date(extract(year from public.today_wib())::int - 1, 8, 15), 'technical'),
  ('50000000-0000-4000-8000-000000000011', 'Stringing SUTET 275 kV Kendari – Kolaka', '40000000-0000-4000-8000-000000000005', 'PLN UIP Sulawesi', 'Kolaka, Sulawesi Tenggara', 275, 48, 120,
   make_date(extract(year from public.today_wib())::int - 1, 1, 10), make_date(extract(year from public.today_wib())::int - 1, 2, 10),
   9000000000, 7700000000, '00000000-0000-4000-8000-000000000003', 55, 'won', make_date(extract(year from public.today_wib())::int - 1, 3, 10), null);

-- A bid revision with a note (the first value was recorded on insert).
update public.tenders
set bid_value = 12500000000, bid_revision_note = 'Penyesuaian harga material setelah aanwijzing'
where id = '50000000-0000-4000-8000-000000000001';

insert into public.client_activities (client_id, tender_id, activity_date, kind, notes, follow_up_date, follow_up_done_at, owner_id)
values
  ('40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', public.today_wib() - 2, 'visit',
   'Kunjungan ke UIP JBTB membahas jadwal aanwijzing dan klarifikasi BoQ.', public.today_wib(), null, '00000000-0000-4000-8000-000000000003'),
  ('40000000-0000-4000-8000-000000000002', null, public.today_wib() - 10, 'call',
   'Telepon PM terkait rencana tender Ungaran – Pedan.', public.today_wib() - 3, null, '00000000-0000-4000-8000-000000000003'),
  ('40000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000003', public.today_wib() - 1, 'meeting',
   'Presentasi metode kerja reconductoring.', public.today_wib() + 4, null, '00000000-0000-4000-8000-000000000003'),
  ('40000000-0000-4000-8000-000000000003', null, public.today_wib() - 40, 'visit',
   'Silaturahmi dan pengenalan perusahaan.', public.today_wib() - 35, now() - interval '34 days', '00000000-0000-4000-8000-000000000003');

-- Projects, contracts, terms and RAB (dev; dates relative to the reset day) — add-projects-contracts
insert into public.projects (
  id, name, client_id, tender_id, end_owner, site, voltage_kv, length_kms, tower_count,
  start_date, target_finish_date, status
) values
  ('60000000-0000-4000-8000-000000000001', 'Stringing SUTT 150 kV Kediri – Pare',
   '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000006', 'PLN UIP JBTB',
   'Kediri, Jawa Timur', 150, 22, 70, public.today_wib() - 45, public.today_wib() + 120, 'running'),
  ('60000000-0000-4000-8000-000000000002', 'Pembangunan SUTET 500 kV Paiton – Grati Seksi 2',
   '40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000007', 'PLN UIP JBTB',
   'Probolinggo, Jawa Timur', 500, 18, 45, public.today_wib() + 14, public.today_wib() + 200, 'preparing'),
  ('60000000-0000-4000-8000-000000000003', 'Perbaikan Tower SUTT 150 kV Tuban',
   '40000000-0000-4000-8000-000000000003', null, 'PLN UIT JBM',
   'Tuban, Jawa Timur', 150, 3, 6, public.today_wib() - 20, public.today_wib() + 40, 'running');

insert into public.project_contracts (project_id, contract_no, contract_date, contract_value, ppn_applicable, maintenance_months, scope) values
  ('60000000-0000-4000-8000-000000000001', '0123/SPK/UIP-JBTB/2026', public.today_wib() - 50, 10000000000, true, 12,
   'Stringing 22 kms SUTT 150 kV Kediri – Pare termasuk pemasangan aksesoris.'),
  ('60000000-0000-4000-8000-000000000002', '0456/SPK/RJE/2026', public.today_wib() - 5, 6000000000, true, 6,
   'Erection dan stringing SUTET 500 kV Paiton – Grati Seksi 2.'),
  ('60000000-0000-4000-8000-000000000003', '0789/SPK/KKN/2026', public.today_wib() - 25, 1800000000, true, 3,
   'Perbaikan 6 tower roboh dan restringing seksi terdampak.');

insert into public.project_addenda (project_id, addendum_no, addendum_date, new_value, description) values
  ('60000000-0000-4000-8000-000000000001', 'ADD-01', public.today_wib() - 10, 10500000000,
   'Penambahan lingkup jumper dan pengecatan tower.');

insert into public.project_terms (
  project_id, sort_order, name, kind, percent, condition_type, condition_progress, condition_date, status, ready_at
) values
  ('60000000-0000-4000-8000-000000000001', 1, 'Uang Muka', 'down_payment', 20, 'manual', null, null, 'ready', now() - interval '40 days'),
  ('60000000-0000-4000-8000-000000000001', 2, 'Termin 1', 'progress', 35, 'progress', 50, null, 'not_due', null),
  ('60000000-0000-4000-8000-000000000001', 3, 'Termin 2', 'progress', 40, 'progress', 100, null, 'not_due', null),
  ('60000000-0000-4000-8000-000000000001', 4, 'Retensi', 'retention', 5, 'date', null, public.today_wib() + 485, 'not_due', null),
  ('60000000-0000-4000-8000-000000000002', 1, 'Uang Muka', 'down_payment', 10, 'manual', null, null, 'not_due', null),
  ('60000000-0000-4000-8000-000000000002', 2, 'Termin 1', 'progress', 85, 'progress', 100, null, 'not_due', null),
  ('60000000-0000-4000-8000-000000000002', 3, 'Retensi', 'retention', 5, 'date', null, public.today_wib() + 380, 'not_due', null),
  ('60000000-0000-4000-8000-000000000003', 1, 'Pembayaran setelah BAST', 'progress', 100, 'manual', null, null, 'not_due', null);

insert into public.project_budgets (project_id, cost_category_id, amount)
select v.project_id::uuid, c.id, v.amount
from (values
  ('60000000-0000-4000-8000-000000000001', 'WAGES', 3000000000),
  ('60000000-0000-4000-8000-000000000001', 'ACCOM', 600000000),
  ('60000000-0000-4000-8000-000000000001', 'MOBIL', 400000000),
  ('60000000-0000-4000-8000-000000000001', 'MATERIAL', 2500000000),
  ('60000000-0000-4000-8000-000000000001', 'RENTAL', 1200000000),
  ('60000000-0000-4000-8000-000000000001', 'FUEL', 500000000),
  ('60000000-0000-4000-8000-000000000001', 'SAFETY', 300000000),
  ('60000000-0000-4000-8000-000000000001', 'PERMIT', 300000000),
  ('60000000-0000-4000-8000-000000000001', 'OTHER', 200000000),
  ('60000000-0000-4000-8000-000000000002', 'WAGES', 2000000000),
  ('60000000-0000-4000-8000-000000000002', 'MATERIAL', 1500000000),
  ('60000000-0000-4000-8000-000000000002', 'RENTAL', 1000000000),
  ('60000000-0000-4000-8000-000000000003', 'WAGES', 700000000),
  ('60000000-0000-4000-8000-000000000003', 'MATERIAL', 500000000),
  ('60000000-0000-4000-8000-000000000003', 'RENTAL', 200000000),
  ('60000000-0000-4000-8000-000000000003', 'ACCOM', 100000000)
) as v(project_id, category_code, amount)
join public.cost_categories c on c.code = v.category_code;

-- Sections and stage progress with a dated log (dev) — add-sections-progress
-- Kediri – Pare: S-01 90%, S-02 56%, S-03 35% (PRD §11.2 example), S-04 0% →
-- project 49,1%, just under Termin 1 (≥ 50%).
insert into public.project_sections (
  id, project_id, code, tower_from, tower_to, tower_count, length_km, circuits, planned_start, planned_finish, sort_order
) values
  ('70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'S-01', 'T.01', 'T.06', 5, 2.5, 2,
   public.today_wib() - 40, public.today_wib() - 10, 10),
  ('70000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', 'S-02', 'T.06', 'T.12', 6, 3.0, 2,
   public.today_wib() - 25, public.today_wib() + 5, 20),
  ('70000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', 'S-03', 'T.12', 'T.18', 6, 4.2, 2,
   public.today_wib() - 10, public.today_wib() + 25, 30),
  ('70000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000001', 'S-04', 'T.18', 'T.21', 3, 1.3, 2,
   public.today_wib() + 20, public.today_wib() + 50, 40),
  ('70000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000003', 'S-01', 'T.20', 'T.26', 6, 1.5, 2,
   public.today_wib() - 15, public.today_wib() + 30, 10);

insert into public.progress_updates (
  project_id, section_id, stage_id, old_progress, new_progress, source, note, created_by, created_at
)
select s.project_id, s.id, st.id, v.old_progress, v.new_progress, 'manual', v.note,
       '00000000-0000-4000-8000-000000000006',
       ((public.today_wib() - v.days_ago)::timestamp + time '10:00') at time zone 'Asia/Jakarta'
from (values
  ('70000000-0000-4000-8000-000000000001', 'Pemasangan Pulley', 0, 100, 38, null),
  ('70000000-0000-4000-8000-000000000001', 'Penarikan Pilot Wire', 0, 100, 34, null),
  ('70000000-0000-4000-8000-000000000001', 'Penarikan Konduktor', 0, 50, 30, 'Konduktor T.01–T.03'),
  ('70000000-0000-4000-8000-000000000001', 'Penarikan Konduktor', 50, 100, 25, null),
  ('70000000-0000-4000-8000-000000000001', 'Sagging', 0, 100, 21, null),
  ('70000000-0000-4000-8000-000000000001', 'Clamping', 0, 100, 17, null),
  ('70000000-0000-4000-8000-000000000001', 'Spacer & Damper', 0, 100, 13, null),
  ('70000000-0000-4000-8000-000000000002', 'Pemasangan Pulley', 0, 100, 23, null),
  ('70000000-0000-4000-8000-000000000002', 'Penarikan Pilot Wire', 0, 100, 19, null),
  ('70000000-0000-4000-8000-000000000002', 'Penarikan Konduktor', 0, 40, 15, null),
  ('70000000-0000-4000-8000-000000000002', 'Penarikan Konduktor', 40, 100, 9, null),
  ('70000000-0000-4000-8000-000000000002', 'Sagging', 0, 40, 4, 'Sagging T.06–T.08'),
  ('70000000-0000-4000-8000-000000000003', 'Pemasangan Pulley', 0, 100, 8, null),
  ('70000000-0000-4000-8000-000000000003', 'Penarikan Pilot Wire', 0, 100, 5, null),
  ('70000000-0000-4000-8000-000000000003', 'Penarikan Konduktor', 0, 50, 2, 'Konduktor T.12–T.15'),
  ('70000000-0000-4000-8000-000000000005', 'Pemasangan Pulley', 0, 100, 10, null),
  ('70000000-0000-4000-8000-000000000005', 'Penarikan Pilot Wire', 0, 50, 3, null)
) as v(section_id, stage_name, old_progress, new_progress, days_ago, note)
join public.project_sections s on s.id = v.section_id::uuid
join public.project_stages st on st.project_id = s.project_id and st.name = v.stage_name;

insert into public.section_progress (section_id, stage_id, progress, updated_at, updated_by)
select distinct on (u.section_id, u.stage_id) u.section_id, u.stage_id, u.new_progress, u.created_at, u.created_by
from public.progress_updates u
order by u.section_id, u.stage_id, u.created_at desc;

-- Assignments and attendance (dev) — add-assignments-attendance
-- Entered as HCM so the override and the audit entries name a person.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000005","role":"authenticated"}', false);

-- Kediri – Pare crew. Eko was fit at the start (P3K expiring) and is expired
-- now, so he is marked red. Slamet (TKBT 2 expired) stays unassigned.
insert into public.assignments (employee_id, project_id, position_id, start_date)
select e.id, p.id, e.position_id, p.start_date + v.start_offset
from (values
  ('AJ-0102', 0),
  ('AJ-0103', 15),
  ('AJ-0105', 0),
  ('AJ-0106', 0),
  ('AJ-0107', 0),
  ('AJ-0109', 0)
) as v(employee_no, start_offset)
join public.employees e on e.employee_no = v.employee_no
join public.projects p on p.id = '60000000-0000-4000-8000-000000000001';

-- Driver without SIM B1 on the Tuban repair: saved with an override.
insert into public.assignments (employee_id, project_id, position_id, start_date, override_reason)
select e.id, p.id, e.position_id, p.start_date,
       'SIM B1 sedang diperpanjang; surat keterangan Satlantas terlampir di berkas karyawan.'
from public.employees e
join public.projects p on p.id = '60000000-0000-4000-8000-000000000003'
where e.employee_no = 'AJ-0108';

-- Field attendance for the last five days (today is left for the Lapangan check).
insert into public.attendance_days (project_id, work_date)
select '60000000-0000-4000-8000-000000000001', d::date
from generate_series(public.today_wib() - 5, public.today_wib() - 1, interval '1 day') as d;

insert into public.attendance (employee_id, work_date, status, overtime_hours, project_id)
select a.employee_id, d::date,
  case
    when e.employee_no = 'AJ-0106' and d::date = public.today_wib() - 2 then 'sick'
    when e.employee_no = 'AJ-0107' and d::date = public.today_wib() - 4 then 'permit'
    else 'present'
  end,
  case when e.employee_no in ('AJ-0103', 'AJ-0105') and d::date in (public.today_wib() - 1, public.today_wib() - 3) then 2 else 0 end,
  a.project_id
from public.assignments a
join public.employees e on e.id = a.employee_id
cross join generate_series(public.today_wib() - 5, public.today_wib() - 1, interval '1 day') as d
where a.project_id = '60000000-0000-4000-8000-000000000001';

-- Office attendance for the last three days.
insert into public.attendance (employee_id, work_date, status, project_id)
select e.id, d::date,
  case when e.employee_no = 'AJ-0005' and d::date = public.today_wib() - 1 then 'leave' else 'present' end,
  null
from public.employees e
cross join generate_series(public.today_wib() - 3, public.today_wib() - 1, interval '1 day') as d
where e.work_type = 'office' and e.is_active;

select set_config('request.jwt.claims', '', false);

-- Daily reports (dev) — add-daily-reports
-- Kediri – Pare has reports for the last four days; Tuban has none for
-- yesterday, so it shows as missing.
insert into public.daily_reports (
  id, project_id, report_date, status, no_activity, no_activity_reason,
  weather_morning, weather_midday, weather_afternoon, effective_hours, safety_briefing, briefing_participants,
  equipment_used, plan_tomorrow, submitted_by, submitted_at, reviewed_by, reviewed_at
) values
  ('80000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', public.today_wib() - 4, 'reviewed',
   false, null, 'clear', 'clear', 'cloudy', 8, true, 6, 'Winch 5 ton, puller-tensioner',
   'Lanjut sagging T.08–T.10', '00000000-0000-4000-8000-000000000007', now() - interval '4 days',
   '00000000-0000-4000-8000-000000000006', now() - interval '3 days'),
  ('80000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', public.today_wib() - 3, 'reviewed',
   true, 'Hujan lebat sepanjang hari, pekerjaan di ketinggian dihentikan', 'heavy_rain', 'heavy_rain', 'heavy_rain',
   null, false, null, null, 'Lanjut tarik konduktor S-03 bila cuaca membaik', '00000000-0000-4000-8000-000000000007',
   now() - interval '3 days', '00000000-0000-4000-8000-000000000006', now() - interval '2 days'),
  ('80000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', public.today_wib() - 2, 'submitted',
   false, null, 'clear', 'rain', 'cloudy', 6, true, 6, 'Puller-tensioner, drum stand',
   'Tarik konduktor T.15–T.16', '00000000-0000-4000-8000-000000000007', now() - interval '2 days', null, null),
  ('80000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000001', public.today_wib() - 1, 'submitted',
   false, null, 'cloudy', 'cloudy', 'clear', 7, true, 6, 'Puller-tensioner',
   'Persiapan sagging S-03', '00000000-0000-4000-8000-000000000007', now() - interval '1 day', null, null);

insert into public.daily_report_activities (report_id, section_id, stage_id, progress_after, notes, sort_order)
select v.report_id::uuid, s.id, st.id, v.progress, v.notes, v.sort_order
from (values
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', 'Sagging', 40, 'Sagging T.06–T.08', 1),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', 'Penarikan Konduktor', 50, 'Konduktor T.12–T.15', 1),
  ('80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000003', 'Penarikan Konduktor', 50, 'Persiapan tarik T.15–T.16', 1)
) as v(report_id, section_id, stage_name, progress, notes, sort_order)
join public.project_sections s on s.id = v.section_id::uuid
join public.project_stages st on st.project_id = s.project_id and st.name = v.stage_name;

insert into public.daily_report_obstacles (report_id, category, description, sort_order) values
  ('80000000-0000-4000-8000-000000000001', 'row_land', 'Warga meminta ganti rugi tanaman di bawah T.09', 1),
  ('80000000-0000-4000-8000-000000000003', 'row_land', 'Negosiasi ROW T.16 belum selesai', 1),
  ('80000000-0000-4000-8000-000000000003', 'weather', 'Hujan siang, pekerjaan berhenti 2 jam', 2),
  ('80000000-0000-4000-8000-000000000004', 'material_late', 'Klem suspensi belum datang', 1);

-- The seeded progress steps of those days came from these reports.
update public.progress_updates u
set source = 'daily_report', daily_report_id = r.id
from public.daily_reports r
join public.daily_report_activities a on a.report_id = r.id
where u.section_id = a.section_id
  and u.stage_id = a.stage_id
  and u.new_progress = a.progress_after
  and (u.created_at at time zone 'Asia/Jakarta')::date = r.report_date;

-- Equipment and delivery notes (dev) — add-equipment-mobilization
-- Created through the functions as Operasional (and received as Lukman), then
-- the movement times are moved back so stays and rentals have history.
insert into public.suppliers (name, category, contact_name, phone, payment_term_days) values
  ('CV Sarana Stringing', 'equipment_rental', 'Hendra Saputra', '081333221100', 30);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000006","role":"authenticated"}', false);

do $$
declare
  warehouse uuid := (select id from public.locations where code = 'GDG-LMG');
  site uuid := (select location_id from public.projects where id = '60000000-0000-4000-8000-000000000001');
  main_category uuid := (select id from public.item_categories where kind = 'tool' and name = 'Mesin Utama');
  aux_category uuid := (select id from public.item_categories where kind = 'tool' and name = 'Alat Bantu');
  rental uuid := (select id from public.suppliers where name = 'CV Sarana Stringing');
  puller uuid;
  tensioner uuid;
  pulley uuid;
  come_along uuid;
  first_note uuid;
  second_note uuid;
begin
  puller := public.create_tool(jsonb_build_object('code', 'PL-01', 'name', 'Puller hidrolik 5 ton', 'category_id', main_category,
    'tracking', 'unit', 'serial_no', 'PT-2019-0042'), warehouse, 'good', 1);
  tensioner := public.create_tool(jsonb_build_object('code', 'TN-01', 'name', 'Tensioner 2×3 ton', 'category_id', main_category,
    'tracking', 'unit', 'serial_no', 'TS-2021-0117', 'ownership', 'rented', 'supplier_id', rental,
    'rental_rate', 750000, 'rental_period', 'day'), warehouse, 'good', 1);
  perform public.create_tool(jsonb_build_object('code', 'GS-01', 'name', 'Genset 10 kVA', 'category_id', main_category,
    'tracking', 'unit', 'serial_no', 'GS-2020-0007'), warehouse, 'good', 1);
  pulley := public.create_tool(jsonb_build_object('code', 'PUL-150', 'name', 'Pulley stringing block 150 kV',
    'category_id', aux_category, 'tracking', 'quantity'), warehouse, 'good', 60);
  come_along := public.create_tool(jsonb_build_object('code', 'CA-03', 'name', 'Come-along 3 ton',
    'category_id', aux_category, 'tracking', 'quantity'), warehouse, 'good', 12);
  perform public.create_tool(jsonb_build_object('code', 'RB-01', 'name', 'Running board', 'category_id', aux_category,
    'tracking', 'quantity'), warehouse, 'good', 4);

  first_note := public.send_delivery_note(
    jsonb_build_object('from_location_id', warehouse, 'to_location_id', site, 'note_date', public.today_wib() - 42,
      'vehicle', 'Truk L 9123 AB', 'driver', 'Andi Wijaya'),
    jsonb_build_array(
      jsonb_build_object('tool_id', puller, 'condition', 'good', 'quantity', 1),
      jsonb_build_object('tool_id', tensioner, 'condition', 'good', 'quantity', 1),
      jsonb_build_object('tool_id', pulley, 'condition', 'good', 'quantity', 30)
    ));

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000007","role":"authenticated"}', false);
  perform public.receive_delivery_note(first_note,
    (select jsonb_agg(jsonb_build_object('line_id', id, 'received_good', quantity, 'received_damaged', 0))
     from public.delivery_note_tool_lines where note_id = first_note),
    'Diterima lengkap');
  perform public.change_tool_condition(pulley, site, 'good', 'damaged', 2, 'Bearing pecah saat penarikan pilot wire');

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000006","role":"authenticated"}', false);
  second_note := public.send_delivery_note(
    jsonb_build_object('from_location_id', warehouse, 'to_location_id', site, 'note_date', public.today_wib() - 1,
      'vehicle', 'Pick-up L 8812 CD', 'driver', 'Andi Wijaya', 'notes', 'Tambahan untuk S-03 dan S-04'),
    jsonb_build_array(
      jsonb_build_object('tool_id', pulley, 'condition', 'good', 'quantity', 10),
      jsonb_build_object('tool_id', come_along, 'condition', 'good', 'quantity', 2)
    ));

  update public.tool_movements set created_at = now() - interval '90 days' where kind = 'opening';
  update public.tool_movements set created_at = now() - interval '42 days' where delivery_note_id = first_note and kind = 'send';
  update public.tool_movements set created_at = now() - interval '40 days' where delivery_note_id = first_note and kind = 'receive';
  update public.tool_movements set created_at = now() - interval '10 days' where kind = 'condition';
  update public.tool_movements set created_at = now() - interval '1 day' where delivery_note_id = second_note;
  update public.delivery_notes set sent_at = now() - interval '42 days', received_at = now() - interval '40 days'
  where id = first_note;
  update public.delivery_notes set sent_at = now() - interval '1 day' where id = second_note;
end;
$$;

select set_config('request.jwt.claims', '', false);
