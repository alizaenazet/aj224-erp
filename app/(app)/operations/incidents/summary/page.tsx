import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { IncidentMonthlyTable } from "@/components/k3/monthly-table";
import { K3StatsTable } from "@/components/k3/stats-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { formatNumber, todayWib } from "@/lib/format";
import { K3_OFFICE_VIEW_ROLES } from "@/lib/k3/labels";
import { incidentMonthly, k3Stats } from "@/lib/k3/queries";
import { parseDateRange, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Ringkasan K3" };

type SearchParams = Promise<RawSearchParams>;

export default function K3SummaryPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Ringkasan K3" description="Jam kerja diambil dari absensi; LTIFR = (LTI + Fatal) × 1.000.000 ÷ jam kerja." />
      <Suspense fallback={<ContentSkeleton />}>
        <SummaryContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SummaryContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(K3_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const range = parseDateRange(await searchParams);
  const today = todayWib();
  const from = range.from ?? `${today.slice(0, 4)}-01-01`;
  const to = range.to ?? today;
  const [stats, monthly] = await Promise.all([k3Stats(from, to), incidentMonthly(from, to)]);
  const company = stats.find((row) => row.project_id === null);

  const tiles: [string, string][] = [
    ["Hari tanpa LTI (perusahaan)", company?.lti_free_days === null || !company ? "—" : formatNumber(company.lti_free_days)],
    ["Insiden pada periode", formatNumber(company?.total ?? 0)],
    ["Tindakan terbuka", `${formatNumber(company?.open_actions ?? 0)}${company?.overdue_actions ? ` (${company.overdue_actions} terlambat)` : ""}`],
    ["LTIFR", company?.ltifr === null || !company ? "—" : formatNumber(company.ltifr, 2)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        filters={<DateRangeFilter placeholder={`Tahun ${today.slice(0, 4)}`} />}
        actions={<ExportButton exportKey="k3-summary" />}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-xl tabular-nums sm:text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Per proyek</CardTitle>
          <CardDescription>Hari tanpa LTI dihitung sejak LTI/Fatal terakhir, atau sejak proyek mulai.</CardDescription>
        </CardHeader>
        <CardContent>
          <K3StatsTable rows={stats} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Per bulan</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentMonthlyTable rows={monthly} />
        </CardContent>
      </Card>
    </div>
  );
}
