-- Project P/L, health status, monthly company summary and the project close
-- checklist. PRD FIN-11, FIN-12, FIN-14, PRJ-09, PRJ-11, §11.3 (change: add-project-pl).
--
-- The P/L views are owner views (not security_invoker) with an explicit role
-- filter: PRD §13 lets Operasional read L/R proyek, but it cannot read invoice
-- rows, so the aggregates are computed with the owner's rights for exactly the
-- P/L roles.

-- ---------------------------------------------------------------------------
-- FIN-11: budget vs actual per category
-- ---------------------------------------------------------------------------
create view public.project_cost_by_category
as
with keys as (
  select project_id, cost_category_id from public.project_budgets
  union
  select project_id, cost_category_id from public.cost_entries where project_id is not null
)
select
  k.project_id,
  k.cost_category_id,
  c.code as category_code,
  c.name as category_name,
  c.sort_order,
  coalesce(b.amount, 0) as budget,
  coalesce(a.actual, 0) as actual,
  coalesce(b.amount, 0) - coalesce(a.actual, 0) as remaining,
  case when coalesce(b.amount, 0) > 0 then round(coalesce(a.actual, 0) / b.amount * 100, 2) end as used_pct,
  greatest(coalesce(b.amount, 0), coalesce(a.actual, 0)) as final_estimate
from keys k
join public.cost_categories c on c.id = k.cost_category_id
left join public.project_budgets b on b.project_id = k.project_id and b.cost_category_id = k.cost_category_id
left join lateral (
  select sum(e.amount) as actual from public.cost_entries e
  where e.project_id = k.project_id and e.cost_category_id = k.cost_category_id
) a on true
where (select public.has_role('super_admin', 'director', 'finance', 'operations'));

-- ---------------------------------------------------------------------------
-- FIN-12 + §11.3 health, one row per project
-- ---------------------------------------------------------------------------
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
    -- Supplier payments are attributed to a project by its share of the bill lines.
    coalesce((select round(sum(sp.amount * l.amount / nullif(b.subtotal, 0)), 0)
              from public.supplier_payments sp
              join public.supplier_bills b on b.id = sp.bill_id
              join public.supplier_bill_lines l on l.bill_id = b.id
              where l.project_id = o.id and sp.status = 'active' and not sp.is_opening), 0) as supplier_paid,
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
  b.supplier_paid + b.expenses_paid + b.net_topups as cash_out,
  b.cash_in - (b.supplier_paid + b.expenses_paid + b.net_topups) as cash_position,
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

revoke all on table public.project_cost_by_category from anon;
revoke all on table public.project_financials from anon;
grant select on table public.project_cost_by_category to authenticated;
grant select on table public.project_financials to authenticated;

-- ---------------------------------------------------------------------------
-- FIN-14: monthly company summary
-- ---------------------------------------------------------------------------
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
  from months m
  order by m.month;
end;
$$;

revoke execute on function public.company_monthly_summary(integer) from public, anon;
grant execute on function public.company_monthly_summary(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- PRJ-11: close checklist and closing with Direktur override
-- ---------------------------------------------------------------------------
create or replace function public.project_close_checklist(p_project uuid)
returns table (key text, label text, ok boolean, detail text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_location uuid;
  v_tools integer;
  v_tools_transit integer;
  v_materials integer;
  v_balance numeric;
  v_pending integer;
  v_terms integer;
begin
  if not public.has_role('super_admin', 'director', 'finance', 'operations') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select location_id into v_location from public.projects where id = p_project;
  select coalesce(sum(quantity), 0) into v_tools
  from public.tool_stock where location_id = v_location and condition <> 'lost';
  select count(*) into v_tools_transit from public.delivery_notes where to_location_id = v_location and status = 'sent';
  select count(*) into v_materials from public.material_stock where location_id = v_location and quantity > 0;
  select coalesce(balance, 0), coalesce(pending_count, 0) into v_balance, v_pending
  from public.field_cash_balances where project_id = p_project;
  select count(*) into v_terms from public.project_terms
  where project_id = p_project and kind <> 'retention' and status <> 'paid';

  return query values
    ('tools', 'Semua alat sudah didemobilisasi', v_tools = 0 and v_tools_transit = 0,
     case when v_tools = 0 and v_tools_transit = 0 then 'Tidak ada alat di lokasi proyek'
          else format('%s alat di lokasi, %s surat jalan menuju lokasi', v_tools, v_tools_transit) end),
    ('materials', 'Rekonsiliasi material selesai', v_materials = 0,
     case when v_materials = 0 then 'Tidak ada sisa stok material di lokasi'
          else format('%s material masih ada stok di lokasi', v_materials) end),
    ('field_cash', 'Kas lapangan nol / dikembalikan', coalesce(v_balance, 0) = 0 and coalesce(v_pending, 0) = 0,
     case when coalesce(v_balance, 0) = 0 and coalesce(v_pending, 0) = 0 then 'Saldo kas lapangan Rp 0'
          else format('Kas lapangan belum nol: saldo Rp %s, %s menunggu verifikasi',
            replace(to_char(coalesce(v_balance, 0), 'FM999,999,999,999,990'), ',', '.'), coalesce(v_pending, 0)) end),
    ('terms', 'Semua termin selain retensi lunas', v_terms = 0,
     case when v_terms = 0 then 'Semua termin non-retensi Lunas' else format('%s termin belum Lunas', v_terms) end);
end;
$$;

create or replace function public.close_project(p_project uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_failed text;
begin
  if not public.has_role('finance', 'operations', 'director') then
    raise exception 'Anda tidak memiliki akses untuk tindakan ini.' using errcode = '42501';
  end if;
  select status into v_status from public.projects where id = p_project for update;
  if not found then
    raise exception 'Proyek tidak ditemukan.';
  end if;
  if v_status <> 'completed' then
    raise exception 'Proyek harus berstatus Selesai sebelum ditutup.';
  end if;
  select string_agg(c.detail, '; ') into v_failed from public.project_close_checklist(p_project) c where not c.ok;
  if v_failed is not null then
    if not public.has_role('director') then
      raise exception 'Checklist penutupan belum terpenuhi: %', v_failed;
    end if;
    if length(btrim(coalesce(p_note, ''))) = 0 then
      raise exception 'Isi catatan override penutupan';
    end if;
    perform public.log_audit_event('projects', p_project::text, 'override', btrim(p_note),
      jsonb_build_object('close_override', v_failed));
  end if;
  update public.projects set status = 'closed' where id = p_project;
end;
$$;

revoke execute on function public.project_close_checklist(uuid) from public, anon;
revoke execute on function public.close_project(uuid, text) from public, anon;
grant execute on function public.project_close_checklist(uuid) to authenticated;
grant execute on function public.close_project(uuid, text) to authenticated;
