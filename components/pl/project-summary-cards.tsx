import "server-only";

import Link from "next/link";
import { HealthBadge } from "@/components/pl/health-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projectCrew } from "@/lib/assignments/queries";
import { ASSIGNMENT_VIEW_ROLES } from "@/lib/assignments/labels";
import { hasAnyRole, type AppRole } from "@/lib/auth/roles";
import { OBSTACLE_LABELS, REPORT_VIEW_ROLES, type ObstacleCategory } from "@/lib/daily-reports/labels";
import { EQUIPMENT_VIEW_ROLES } from "@/lib/equipment/labels";
import { locationStock } from "@/lib/equipment/queries";
import { formatDate, formatNumber, formatRupiah, todayWib } from "@/lib/format";
import { K3_VIEW_ROLES } from "@/lib/k3/labels";
import { k3Stats } from "@/lib/k3/queries";
import { PL_VIEW_ROLES } from "@/lib/pl/labels";
import { projectFinancials } from "@/lib/pl/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { project: { id: string; location_id: string | null; start_date: string | null }; role: AppRole };

async function latestObstacles(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_report_obstacles")
    .select("category, description, report:daily_reports!inner(id, report_date, project_id)")
    .eq("report.project_id", projectId)
    .order("report_date", { referencedTable: "report", ascending: false })
    .limit(20);
  return (data ?? [])
    .map((row) => ({
      category: row.category as ObstacleCategory,
      description: row.description,
      date: (row.report as unknown as { report_date: string }).report_date,
      reportId: (row.report as unknown as { id: string }).id,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
}

/** Ringkasan figures from every module (PRJ-09): finance for P/L roles, operations for module readers. */
export async function ProjectSummaryCards({ project, role }: Props) {
  const today = todayWib();
  const [financials, crew, tools, stats, obstacles] = await Promise.all([
    hasAnyRole(role, PL_VIEW_ROLES) ? projectFinancials(project.id) : Promise.resolve(null),
    hasAnyRole(role, ASSIGNMENT_VIEW_ROLES) ? projectCrew(project.id, today) : Promise.resolve(null),
    hasAnyRole(role, EQUIPMENT_VIEW_ROLES) && project.location_id ? locationStock(project.location_id) : Promise.resolve(null),
    hasAnyRole(role, K3_VIEW_ROLES) ? k3Stats(project.start_date ?? `${today.slice(0, 4)}-01-01`, today) : Promise.resolve(null),
    hasAnyRole(role, REPORT_VIEW_ROLES) ? latestObstacles(project.id) : Promise.resolve(null),
  ]);
  const k3 = stats?.find((row) => row.project_id === project.id) ?? null;
  const toolCount = tools ? tools.filter((row) => row.condition !== "lost").reduce((sum, row) => sum + row.quantity, 0) : null;

  const finance: [string, React.ReactNode][] = financials
    ? [
        ["Kesehatan", <HealthBadge key="health" health={financials.health} />],
        ["Nilai kontrak", formatRupiah(financials.contract_value)],
        ["Total ditagih", formatRupiah(financials.billed_total)],
        ["Total diterima", formatRupiah(financials.received_total)],
        ["Belum ditagih", formatRupiah(financials.unbilled)],
        ["Total biaya", formatRupiah(financials.cost)],
        ["Laba kotor", formatRupiah(financials.gross_profit)],
        ["Margin", financials.margin === null ? "—" : `${formatNumber(financials.margin, 1)}%`],
      ]
    : [];
  const operations: [string, React.ReactNode][] = [
    ...(crew ? ([["Tim aktif hari ini", `${crew.length} orang`]] as [string, React.ReactNode][]) : []),
    ...(toolCount !== null ? ([["Alat di lokasi", `${formatNumber(toolCount)} unit`]] as [string, React.ReactNode][]) : []),
    ...(k3
      ? ([
          ["Insiden sejak mulai", formatNumber(k3.total)],
          ["Hari tanpa LTI", k3.lti_free_days === null ? "—" : formatNumber(k3.lti_free_days)],
        ] as [string, React.ReactNode][])
      : []),
  ];

  if (!finance.length && !operations.length && !obstacles) return null;

  const list = (rows: [string, React.ReactNode][]) => (
    <dl className="flex flex-col gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="ml-auto text-right font-medium whitespace-nowrap">{value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {finance.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Keuangan</CardTitle>
            <CardDescription>
              <Link href="/finance/pl" className="underline-offset-4 hover:underline">
                Laporan L/R
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>{list(finance)}</CardContent>
        </Card>
      ) : null}
      {operations.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Lapangan</CardTitle>
          </CardHeader>
          <CardContent>{list(operations)}</CardContent>
        </Card>
      ) : null}
      {obstacles ? (
        <Card>
          <CardHeader>
            <CardTitle>Kendala terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {obstacles.length ? (
              <ul className="flex flex-col gap-3 text-sm">
                {obstacles.map((item, index) => (
                  <li key={index} className="flex flex-col gap-1">
                    <Link href={`/operations/daily-reports/${item.reportId}`} className="font-medium underline-offset-4 hover:underline">
                      {OBSTACLE_LABELS[item.category] ?? item.category} · {formatDate(item.date)}
                    </Link>
                    <span className="text-muted-foreground">{item.description}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada kendala dilaporkan.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
