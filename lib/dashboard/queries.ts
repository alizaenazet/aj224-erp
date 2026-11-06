import "server-only";

import { addDays } from "@/lib/daily-reports/context";
import { OBSTACLE_LABELS, type ObstacleCategory } from "@/lib/daily-reports/labels";
import { formatDate, formatRupiah, todayWib } from "@/lib/format";
import { k3Stats } from "@/lib/k3/queries";
import { queryFinancials } from "@/lib/pl/queries";
import { createClient } from "@/lib/supabase/server";

export type ActionItem = { label: string; detail: string; href: string; tone?: "warning" | "destructive" | "secondary" };
export type ActionGroup = { title: string; href: string; items: ActionItem[]; empty: string };

const ACTIVE_PROJECT = ["preparing", "running", "on_hold"];
const ACTIVE_TENDER = ["prospect", "preparing", "submitted", "negotiation"];
const num = (value: unknown) => Number(value ?? 0);

/** DSB-01 … DSB-03 for Direktur. */
export async function directorDashboard() {
  const supabase = await createClient();
  const today = todayWib();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const [financials, { data: invoices }, { data: bills }, { data: winStats }, { data: pipeline }, k3, { data: crew }, { data: payroll }, { data: aging }, { data: monthly }, { data: obstacles }, { data: costs }] =
    await Promise.all([
      queryFinancials({ status: null, health: null }),
      supabase.from("invoice_list").select("balance, days_overdue").in("status", ["issued", "partial"]),
      supabase.from("supplier_bill_list").select("balance, due_date").in("status", ["unpaid", "partial"]),
      supabase.rpc("tender_win_stats", { p_from: yearStart, p_to: today }),
      supabase.rpc("tender_pipeline"),
      k3Stats(yearStart, today),
      supabase.from("assignment_list").select("cert_state, override_reason, state").eq("state", "active"),
      supabase.from("payroll_periods").select("id, name").eq("status", "submitted"),
      supabase.from("receivable_aging").select("current_amount, d1_30, d31_60, d61_90, d90_plus"),
      supabase.from("incident_monthly").select("month, count").gte("month", yearStart),
      supabase.from("daily_report_obstacle_summary").select("project_id, category, obstacle_count"),
      supabase.from("project_cost_by_category").select("project_id, category_name, sort_order, actual"),
    ]);

  const active = financials.rows.filter((row) => ACTIVE_PROJECT.includes(row.status));
  const all = (winStats ?? []).find((row: { dimension: string }) => row.dimension === "all") as { win_rate_count: number | null } | undefined;
  const company = k3.find((row) => row.project_id === null);
  const in7 = addDays(today, 7);

  const cards = {
    activeContract: active.reduce((sum, row) => sum + row.contract_value, 0),
    activeCount: active.length,
    unbilled: active.reduce((sum, row) => sum + Math.max(row.unbilled, 0), 0),
    receivable: (invoices ?? []).reduce((sum, row) => sum + num(row.balance), 0),
    receivableOverdue: (invoices ?? []).filter((row) => num(row.days_overdue) > 0).reduce((sum, row) => sum + num(row.balance), 0),
    payable: (bills ?? []).reduce((sum, row) => sum + num(row.balance), 0),
    payableDue7: (bills ?? []).filter((row) => row.due_date <= in7).reduce((sum, row) => sum + num(row.balance), 0),
    winRate: all?.win_rate_count === null || all?.win_rate_count === undefined ? null : num(all.win_rate_count),
    pipeline: (pipeline ?? [])
      .filter((row: { status: string }) => ACTIVE_TENDER.includes(row.status))
      .reduce((sum: number, row: { bid_value: number }) => sum + num(row.bid_value), 0),
    ltiFreeDays: company?.lti_free_days ?? null,
    certIssues: (crew ?? []).filter((row) => row.cert_state === "expired" || row.cert_state === "missing").length,
    overrides: (crew ?? []).filter((row) => row.override_reason).length,
    payrollPending: (payroll ?? []).length,
  };

  const topObstacle = (projectId: string) => {
    const rows = (obstacles ?? []).filter((row) => row.project_id === projectId).sort((a, b) => num(b.obstacle_count) - num(a.obstacle_count));
    return rows[0] ? `${OBSTACLE_LABELS[rows[0].category as ObstacleCategory] ?? rows[0].category} (${rows[0].obstacle_count}×)` : null;
  };
  const health = active.map((row) => ({ ...row, top_obstacle: topObstacle(row.project_id) }));

  const agingTotals = (aging ?? []).reduce(
    (sum, row) => ({
      current: sum.current + num(row.current_amount),
      d1_30: sum.d1_30 + num(row.d1_30),
      d31_60: sum.d31_60 + num(row.d31_60),
      d61_90: sum.d61_90 + num(row.d61_90),
      d90_plus: sum.d90_plus + num(row.d90_plus),
    }),
    { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 },
  );
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const currentMonth = Number(today.slice(5, 7));
  const charts = {
    aging: [
      { label: "Belum JT", value: agingTotals.current },
      { label: "1–30", value: agingTotals.d1_30 },
      { label: "31–60", value: agingTotals.d31_60 },
      { label: "61–90", value: agingTotals.d61_90 },
      { label: "> 90", value: agingTotals.d90_plus },
    ],
    incidents: MONTHS.slice(0, currentMonth).map((label, index) => ({
      label,
      value: (monthly ?? []).filter((row) => Number(String(row.month).slice(5, 7)) === index + 1).reduce((sum, row) => sum + row.count, 0),
    })),
    pipeline: ACTIVE_TENDER.map((status) => ({
      label: { prospect: "Prospek", preparing: "Persiapan", submitted: "Dikirim", negotiation: "Negosiasi" }[status] ?? status,
      value: num((pipeline ?? []).find((row: { status: string }) => row.status === status)?.bid_value),
    })),
    costByProject: active.map((project) => ({
      code: project.code,
      rows: (costs ?? [])
        .filter((row) => row.project_id === project.project_id && num(row.actual) > 0)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((row) => ({ label: row.category_name as string, value: num(row.actual) })),
    })),
  };
  return { cards, health, charts };
}

/** DSB-04 Finance. */
export async function financeActions(): Promise<ActionGroup[]> {
  const supabase = await createClient();
  const in7 = addDays(todayWib(), 7);
  const [{ data: terms }, { data: invoices }, { data: bills }, { data: cash }, { data: payroll }] = await Promise.all([
    supabase.from("project_term_list").select("id, project_id, name, amount_value, project:projects(code)").eq("status", "ready").limit(20),
    supabase.from("invoice_list").select("id, number, client_name, balance, due_date, days_overdue").in("status", ["issued", "partial"]).lte("due_date", in7).order("due_date").limit(20),
    supabase.from("supplier_bill_list").select("id, supplier_name, bill_no, balance, due_date, days_overdue").in("status", ["unpaid", "partial"]).lte("due_date", in7).order("due_date").limit(20),
    supabase.from("field_cash_balances").select("project_id, project_code, pending, pending_count").gt("pending_count", 0),
    supabase.from("payroll_periods").select("id, name").eq("status", "approved"),
  ]);
  return [
    {
      title: "Termin siap ditagih",
      href: "/projects",
      empty: "Tidak ada termin siap ditagih.",
      items: (terms ?? []).map((row) => ({
        label: `${(row.project as unknown as { code: string } | null)?.code ?? ""} · ${row.name}`,
        detail: formatRupiah(num(row.amount_value)),
        href: `/finance/invoices/new?term=${row.id}`,
        tone: "warning" as const,
      })),
    },
    {
      title: "Piutang jatuh tempo ≤ 7 hari",
      href: "/finance/invoices?open=1",
      empty: "Tidak ada piutang yang segera jatuh tempo.",
      items: (invoices ?? []).map((row) => ({
        label: `${row.number} · ${row.client_name ?? ""}`,
        detail: `${formatRupiah(num(row.balance))} · ${num(row.days_overdue) > 0 ? `${row.days_overdue} hari terlambat` : `jatuh tempo ${formatDate(row.due_date)}`}`,
        href: `/finance/invoices/${row.id}`,
        tone: num(row.days_overdue) > 0 ? ("destructive" as const) : ("warning" as const),
      })),
    },
    {
      title: "Utang jatuh tempo ≤ 7 hari",
      href: "/finance/bills",
      empty: "Tidak ada utang yang segera jatuh tempo.",
      items: (bills ?? []).map((row) => ({
        label: `${row.supplier_name} · ${row.bill_no}`,
        detail: `${formatRupiah(num(row.balance))} · ${num(row.days_overdue) > 0 ? `${row.days_overdue} hari terlambat` : formatDate(row.due_date)}`,
        href: `/finance/bills/${row.id}`,
        tone: num(row.days_overdue) > 0 ? ("destructive" as const) : ("warning" as const),
      })),
    },
    {
      title: "Kas lapangan menunggu verifikasi",
      href: "/finance/field-cash",
      empty: "Tidak ada pengeluaran kas lapangan yang menunggu.",
      items: (cash ?? []).map((row) => ({
        label: row.project_code as string,
        detail: `${row.pending_count} item · ${formatRupiah(num(row.pending))}`,
        href: `/finance/field-cash/${row.project_id}`,
        tone: "warning" as const,
      })),
    },
    {
      title: "Payroll siap dibayar",
      href: "/hr/payroll",
      empty: "Tidak ada payroll yang menunggu pembayaran.",
      items: (payroll ?? []).map((row) => ({ label: row.name, detail: "Disetujui Direktur", href: `/hr/payroll/${row.id}`, tone: "warning" as const })),
    },
  ];
}

/** DSB-04 Marketing. */
export async function marketingActions(): Promise<ActionGroup[]> {
  const supabase = await createClient();
  const today = todayWib();
  const in7 = addDays(today, 7);
  const [{ data: tenders }, { data: followUps }] = await Promise.all([
    supabase.from("tenders").select("id, name, status, bid_deadline, weighted_value, client:clients(name)").in("status", ACTIVE_TENDER).order("weighted_value", { ascending: false, nullsFirst: false }).limit(30),
    supabase.from("client_activities").select("id, notes, follow_up_date, client_id, client:clients(name)").is("follow_up_done_at", null).lte("follow_up_date", today).order("follow_up_date").limit(10),
  ]);
  const urgent = (deadline: string | null) => Boolean(deadline && deadline >= today && deadline <= in7);
  return [
    {
      title: "Tender prioritas",
      href: "/marketing/tenders",
      empty: "Tidak ada tender aktif.",
      items: (tenders ?? []).slice(0, 5).map((row) => ({
        label: row.name,
        detail: `${(row.client as unknown as { name: string } | null)?.name ?? ""} · tertimbang ${formatRupiah(num(row.weighted_value))}${urgent(row.bid_deadline) ? " · Mendesak" : ""}`,
        href: `/marketing/tenders/${row.id}`,
        tone: urgent(row.bid_deadline) ? ("destructive" as const) : undefined,
      })),
    },
    {
      title: "Batas penawaran ≤ 7 hari",
      href: "/marketing/tenders",
      empty: "Tidak ada batas penawaran dalam 7 hari.",
      items: (tenders ?? [])
        .filter((row) => urgent(row.bid_deadline) && ["prospect", "preparing"].includes(row.status))
        .map((row) => ({ label: row.name, detail: `batas ${formatDate(row.bid_deadline)}`, href: `/marketing/tenders/${row.id}`, tone: "warning" as const })),
    },
    {
      title: "Tindak lanjut jatuh tempo",
      href: "/marketing/follow-ups",
      empty: "Tidak ada tindak lanjut yang jatuh tempo.",
      items: (followUps ?? []).map((row) => ({
        label: (row.client as unknown as { name: string } | null)?.name ?? "Klien",
        detail: `${formatDate(row.follow_up_date)} · ${row.notes ?? ""}`,
        href: `/marketing/clients/${row.client_id}`,
        tone: "warning" as const,
      })),
    },
  ];
}

/** DSB-04 HCM. */
export async function hcmActions(): Promise<ActionGroup[]> {
  const supabase = await createClient();
  const yesterday = addDays(todayWib(), -1);
  const [{ data: certificates }, { data: workers }, { data: running }, { data: attended }, { data: returned }] = await Promise.all([
    supabase.from("employee_certificate_list").select("id, employee_id, employee_name, certificate_type_name, status, expiry_date").in("status", ["expired", "expiring"]).order("expiry_date").limit(20),
    supabase.from("employees").select("id, full_name, employee_no").eq("verification_status", "pending"),
    supabase.from("projects").select("id, code, name").eq("status", "running"),
    supabase.from("attendance").select("project_id").eq("work_date", yesterday).not("project_id", "is", null),
    supabase.from("payroll_periods").select("id, name, return_note").eq("status", "returned"),
  ]);
  const withAttendance = new Set((attended ?? []).map((row) => row.project_id));
  return [
    {
      title: "Sertifikat bermasalah",
      href: "/hr/certificates?status=problem",
      empty: "Tidak ada sertifikat yang kedaluwarsa atau segera kedaluwarsa.",
      items: (certificates ?? []).map((row) => ({
        label: `${row.employee_name} · ${row.certificate_type_name}`,
        detail: `${row.status === "expired" ? "Kedaluwarsa" : "Segera kedaluwarsa"} ${formatDate(row.expiry_date)}`,
        href: `/hr/employees/${row.employee_id}`,
        tone: row.status === "expired" ? ("destructive" as const) : ("warning" as const),
      })),
    },
    {
      title: "Pekerja baru menunggu verifikasi",
      href: "/hr/employees",
      empty: "Tidak ada pekerja lokal yang menunggu verifikasi.",
      items: (workers ?? []).map((row) => ({ label: row.full_name, detail: row.employee_no, href: `/hr/employees/${row.id}`, tone: "warning" as const })),
    },
    {
      title: "Absensi kemarin belum masuk",
      href: "/hr/attendance",
      empty: "Semua proyek berjalan sudah mengisi absensi kemarin.",
      items: (running ?? [])
        .filter((row) => !withAttendance.has(row.id))
        .map((row) => ({ label: row.code, detail: row.name, href: `/hr/attendance`, tone: "warning" as const })),
    },
    {
      title: "Payroll dikembalikan",
      href: "/hr/payroll",
      empty: "Tidak ada payroll yang dikembalikan.",
      items: (returned ?? []).map((row) => ({ label: row.name, detail: row.return_note ?? "", href: `/hr/payroll/${row.id}`, tone: "destructive" as const })),
    },
  ];
}

/** DSB-04 Operasional. */
export async function operationsActions(): Promise<ActionGroup[]> {
  const supabase = await createClient();
  const since = addDays(todayWib(), -30);
  const [{ data: missing }, { data: shortfalls }, { data: incidents }, { data: low }] = await Promise.all([
    supabase.from("missing_daily_reports").select("project_id, code, name, report_date"),
    supabase
      .from("delivery_notes")
      .select("id, number, received_at, to:locations!delivery_notes_to_location_id_fkey(name), tool:delivery_note_tool_lines(missing, received_damaged), material:delivery_note_material_lines(missing)")
      .eq("status", "received")
      .gte("received_at", since)
      .order("received_at", { ascending: false })
      .limit(30),
    supabase.from("incident_list").select("id, number, project_code, classification, status, open_actions, overdue_actions").in("status", ["reported", "investigating"]).order("occurred_at", { ascending: false }).limit(10),
    supabase.from("material_low_stock").select("material_id, code, location_name, quantity, min_stock, unit_code").limit(10),
  ]);
  const withShortfall = (shortfalls ?? []).filter((note) => {
    const tools = (note.tool ?? []) as { missing: number | null; received_damaged: number | null }[];
    const materials = (note.material ?? []) as { missing: number | null }[];
    return tools.some((line) => num(line.missing) > 0 || num(line.received_damaged) > 0) || materials.some((line) => num(line.missing) > 0);
  });
  return [
    {
      title: "Laporan harian belum masuk",
      href: "/operations/daily-reports",
      empty: "Semua proyek berjalan sudah mengirim laporan kemarin.",
      items: (missing ?? []).map((row) => ({ label: row.code, detail: `${row.name} · ${formatDate(row.report_date)}`, href: `/projects/${row.project_id}/reports`, tone: "warning" as const })),
    },
    {
      title: "Selisih alat & material (30 hari)",
      href: "/operations/delivery-notes",
      empty: "Tidak ada selisih penerimaan.",
      items: withShortfall.map((row) => ({
        label: row.number,
        detail: `${(row.to as unknown as { name: string } | null)?.name ?? ""} · ${formatDate(row.received_at)}`,
        href: `/operations/delivery-notes/${row.id}`,
        tone: "destructive" as const,
      })),
    },
    {
      title: "Insiden K3 terbuka",
      href: "/operations/incidents",
      empty: "Tidak ada insiden terbuka.",
      items: (incidents ?? []).map((row) => ({
        label: `${row.number} · ${row.project_code}`,
        detail: `${row.open_actions} tindakan terbuka${row.overdue_actions ? `, ${row.overdue_actions} terlambat` : ""}`,
        href: `/operations/incidents/${row.id}`,
        tone: row.overdue_actions || ["lti", "fatal"].includes(row.classification) ? ("destructive" as const) : ("warning" as const),
      })),
    },
    {
      title: "Stok di bawah minimum",
      href: "/operations/materials?low=1",
      empty: "Tidak ada material di bawah minimum.",
      items: (low ?? []).map((row) => ({
        label: `${row.code} · ${row.location_name}`,
        detail: `${num(row.quantity).toLocaleString("id-ID")} / min ${num(row.min_stock).toLocaleString("id-ID")} ${row.unit_code}`,
        href: `/operations/materials/${row.material_id}`,
        tone: "warning" as const,
      })),
    },
  ];
}
