import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { MonthlySummaryTable, PlTable } from "@/components/pl/pl-table";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/list/params";
import { HEALTH_LABELS, PL_VIEW_ROLES } from "@/lib/pl/labels";
import { monthlySummary, parsePlParams, queryFinancials } from "@/lib/pl/queries";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/labels";

export const metadata: Metadata = { title: "Laporan L/R" };

type SearchParams = Promise<RawSearchParams>;

export default function PlPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Laporan L/R"
        description="Pendapatan = DPP invoice terbit; biaya dari tagihan supplier, pengeluaran, kas lapangan disetujui dan alokasi gaji (PRD §11.3)."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <PlContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PlContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(PL_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const params = parsePlParams(await searchParams);
  const [{ rows }, monthly] = await Promise.all([queryFinancials(params), monthlySummary(params.year)]);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => String(currentYear - index)).map((value) => ({ value, label: value }));
  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        filters={
          <>
            <SelectFilter
              param="status"
              allLabel="Semua status proyek"
              options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <SelectFilter param="health" allLabel="Semua kesehatan" options={Object.entries(HEALTH_LABELS).map(([value, label]) => ({ value, label }))} />
          </>
        }
        actions={<ExportButton exportKey="project-pl" />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Per proyek</CardTitle>
          <CardDescription>Kesehatan: Normal bila indeks biaya ≤ 10 dan deviasi jadwal ≥ −10; ambang dapat diubah di Parameter Sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlTable rows={rows} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan bulanan {params.year}</CardTitle>
          <CardDescription>Overhead = biaya Kantor/Umum; tidak masuk L/R proyek.</CardDescription>
          <CardAction className="flex gap-2">
            <SelectFilter param="year" allLabel={`Tahun ${currentYear}`} options={years} />
            <ExportButton exportKey="monthly-summary" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <MonthlySummaryTable rows={monthly} />
        </CardContent>
      </Card>
    </div>
  );
}
