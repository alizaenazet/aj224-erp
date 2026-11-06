-- Attachment rules as a registry (UMM-03). Until now every module re-created
-- attachment_bucket / can_read_attachment / can_write_attachment in full to add
-- its entity, so a migration that copied a stale version could silently drop
-- another module's rules. Now each entity is one registry row plus its own
-- attachment_read_<type> and attachment_write_<type> functions; the three
-- shared functions only look them up. A new module adds a row and two
-- functions and never touches the shared ones.

create table public.attachment_entity_types (
  entity_type text primary key check (entity_type ~ '^[a-z_]+$'),
  bucket text not null
);

alter table public.attachment_entity_types enable row level security;
revoke all on table public.attachment_entity_types from anon;
revoke insert, update, delete on table public.attachment_entity_types from authenticated;
create policy "Signed-in users read attachment types" on public.attachment_entity_types
  for select to authenticated using (true);

insert into public.attachment_entity_types (entity_type, bucket) values
  ('employee', 'employee-files'),
  ('employee_certificate', 'employee-files'),
  ('tender', 'marketing-files'),
  ('project', 'project-files'),
  ('attendance_day', 'project-files'),
  ('daily_report', 'project-files'),
  ('tool', 'project-files'),
  ('delivery_note', 'project-files'),
  ('material_transaction', 'project-files'),
  ('incident', 'k3-files'),
  ('incident_action', 'k3-files'),
  ('invoice', 'finance-files'),
  ('invoice_payment', 'finance-files'),
  ('supplier_bill', 'finance-files'),
  ('supplier_payment', 'finance-files'),
  ('expense', 'finance-files'),
  ('field_cash_expense', 'finance-files'),
  ('field_cash_movement', 'finance-files');

-- ---------------------------------------------------------------------------
-- Shared lookups (signatures unchanged; callers and policies keep working)
-- ---------------------------------------------------------------------------
create or replace function public.attachment_bucket(p_entity_type text)
returns text
language sql
stable
set search_path = ''
as $$
  select bucket from public.attachment_entity_types where entity_type = p_entity_type
$$;

create or replace function public.can_read_attachment(p_entity_type text, p_entity_id uuid, p_category text)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  if not exists (select 1 from public.attachment_entity_types where entity_type = p_entity_type) then
    return false;
  end if;
  execute format('select public.%I($1, $2)', 'attachment_read_' || p_entity_type) into v_ok using p_entity_id, p_category;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.can_write_attachment(p_entity_type text, p_entity_id uuid, p_category text)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  if not exists (select 1 from public.attachment_entity_types where entity_type = p_entity_type) then
    return false;
  end if;
  execute format('select public.%I($1, $2)', 'attachment_write_' || p_entity_type) into v_ok using p_entity_id, p_category;
  return coalesce(v_ok, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- Per-entity rules (security invoker: table RLS decides visibility)
-- ---------------------------------------------------------------------------
create function public.attachment_read_employee(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.employees e where e.id = p_id)
    and (p_category = 'photo' or public.has_role('hcm', 'director'))
$$;
create function public.attachment_write_employee(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select public.has_role('hcm')
    and p_category in ('photo', 'ktp', 'kk', 'contract', 'diploma', 'other')
    and exists (select 1 from public.employees e where e.id = p_id)
$$;

create function public.attachment_read_employee_certificate(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.employee_certificates c where c.id = p_id)
$$;
create function public.attachment_write_employee_certificate(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select public.has_role('hcm') and p_category = 'scan'
    and exists (select 1 from public.employee_certificates c where c.id = p_id)
$$;

create function public.attachment_read_tender(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.tenders t where t.id = p_id)
$$;
create function public.attachment_write_tender(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select public.has_role('marketing') and p_category in ('rks', 'boq', 'offer_letter', 'other')
    and exists (select 1 from public.tenders t where t.id = p_id)
$$;

create function public.attachment_read_project(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = p_id)
    and (p_category not in ('contract', 'addendum')
         or public.has_role('super_admin', 'director', 'marketing', 'finance', 'operations'))
$$;
create function public.attachment_write_project(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select public.has_role('marketing', 'finance', 'operations')
    and p_category in ('contract', 'addendum', 'bap', 'bast', 'drawing', 'permit', 'correspondence', 'other')
    and exists (select 1 from public.projects p where p.id = p_id)
$$;

create function public.attachment_read_attendance_day(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.attendance_days d where d.id = p_id)
$$;
create function public.attachment_write_attendance_day(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select public.has_role('hcm', 'field') and p_category = 'sheet'
    and exists (select 1 from public.attendance_days d where d.id = p_id)
$$;

create function public.attachment_read_daily_report(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.daily_reports r where r.id = p_id)
$$;
create function public.attachment_write_daily_report(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select public.has_role('operations', 'field') and p_category = 'photo'
    and exists (select 1 from public.daily_reports r where r.id = p_id and r.status <> 'reviewed')
    and (select count(*) from public.attachments f
         where f.entity_type = 'daily_report' and f.entity_id = p_id and f.category = 'photo') < 10
$$;

create function public.attachment_read_tool(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.tools t where t.id = p_id)
$$;
create function public.attachment_write_tool(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.tools t where t.id = p_id)
    and ((p_category = 'photo' and public.has_role('operations'))
         or (p_category = 'condition' and public.has_role('operations', 'field')))
$$;

create function public.attachment_read_delivery_note(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.delivery_notes n where n.id = p_id)
$$;
create function public.attachment_write_delivery_note(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'receipt'
    and (public.has_role('operations')
         or (public.has_role('field') and exists (
           select 1 from public.delivery_notes n
           where n.id = p_id and n.status = 'sent' and n.to_location_id in (select public.user_location_ids()))))
$$;

create function public.attachment_read_material_transaction(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.material_transactions t where t.id = p_id)
$$;
create function public.attachment_write_material_transaction(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'document'
    and ((public.has_role('operations') and exists (select 1 from public.material_transactions t where t.id = p_id))
         or (public.has_role('field') and exists (
           select 1 from public.material_transactions t
           where t.id = p_id and t.status = 'active' and t.location_id in (select public.user_location_ids()))))
$$;

create function public.attachment_read_incident(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.incidents i where i.id = p_id)
$$;
create function public.attachment_write_incident(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'photo' and public.has_role('operations', 'field')
    and exists (select 1 from public.incidents i where i.id = p_id and i.status not in ('closed', 'cancelled'))
    and (select count(*) from public.attachments f
         where f.entity_type = 'incident' and f.entity_id = p_id and f.category = 'photo') < 10
$$;

create function public.attachment_read_incident_action(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.incident_actions a where a.id = p_id)
$$;
create function public.attachment_write_incident_action(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'evidence' and public.has_role('operations')
    and exists (select 1 from public.incident_actions a where a.id = p_id)
$$;

create function public.attachment_read_invoice(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.invoices i where i.id = p_id)
$$;
create function public.attachment_write_invoice(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category in ('bap', 'other') and public.has_role('finance')
    and exists (select 1 from public.invoices i where i.id = p_id and i.status <> 'cancelled')
$$;

create function public.attachment_read_invoice_payment(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.invoice_payments x where x.id = p_id)
$$;
create function public.attachment_write_invoice_payment(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'proof' and public.has_role('finance')
    and exists (select 1 from public.invoice_payments x where x.id = p_id)
$$;

create function public.attachment_read_supplier_bill(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.supplier_bills b where b.id = p_id)
$$;
create function public.attachment_write_supplier_bill(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category in ('invoice', 'other') and public.has_role('finance')
    and exists (select 1 from public.supplier_bills b where b.id = p_id and b.status <> 'cancelled')
$$;

create function public.attachment_read_supplier_payment(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.supplier_payments x where x.id = p_id)
$$;
create function public.attachment_write_supplier_payment(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'proof' and public.has_role('finance')
    and exists (select 1 from public.supplier_payments x where x.id = p_id)
$$;

create function public.attachment_read_expense(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.expenses x where x.id = p_id)
$$;
create function public.attachment_write_expense(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'receipt' and public.has_role('finance')
    and exists (select 1 from public.expenses x where x.id = p_id and x.status = 'active')
$$;

create function public.attachment_read_field_cash_expense(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.field_cash_expenses x where x.id = p_id)
$$;
create function public.attachment_write_field_cash_expense(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'receipt'
    and (public.has_role('finance')
         or (public.has_role('field') and exists (
           select 1 from public.field_cash_expenses x
           where x.id = p_id and x.status = 'pending' and x.project_id in (select public.user_project_ids()))))
    and exists (select 1 from public.field_cash_expenses x where x.id = p_id)
$$;

create function public.attachment_read_field_cash_movement(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.field_cash_movements x where x.id = p_id)
$$;
create function public.attachment_write_field_cash_movement(p_id uuid, p_category text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_category = 'proof' and public.has_role('finance')
    and exists (select 1 from public.field_cash_movements x where x.id = p_id)
$$;

-- The rule functions are called through the shared lookups only.
do $$
declare
  t text;
begin
  for t in select entity_type from public.attachment_entity_types
  loop
    execute format('revoke execute on function public.%I(uuid, text) from public, anon', 'attachment_read_' || t);
    execute format('revoke execute on function public.%I(uuid, text) from public, anon', 'attachment_write_' || t);
    execute format('grant execute on function public.%I(uuid, text) to authenticated', 'attachment_read_' || t);
    execute format('grant execute on function public.%I(uuid, text) to authenticated', 'attachment_write_' || t);
  end loop;
end;
$$;
