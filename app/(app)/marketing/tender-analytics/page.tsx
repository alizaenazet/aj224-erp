import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import {
  AnalyticsSummary,
  LostReasonsTable,
  PipelineTable,
  WinRateTable,
} from "@/components/tenders/tender-analytics";
import { TenderAnalyticsToolbar } from "@/components/tenders/tender-analytics-toolbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { MARKETING_VIEW_ROLES } from "@/lib/clients/labels";
import { formatDate } from "@/lib/format";
import type { RawSearchParams } from "@/lib/list/params";
import { getTenderAnalytics, parseAnalyticsPeriod } from "@/lib/tenders/analytics";

export const metadata: Metadata = { title: "Analitik Tender" };

type SearchParams = Promise<RawSearchParams>;

export default function TenderAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Analitik Tender"
        description="Win rate = Menang ÷ (Menang + Kalah). Periode menurut tanggal penutupan; tender Batal tidak dihitung."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <TenderAnalyticsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TenderAnalyticsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(MARKETING_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const period = parseAnalyticsPeriod(await searchParams);
  const analytics = await getTenderAnalytics(period);

  return (
    <div className="flex flex-col gap-4">
      <TenderAnalyticsToolbar
        defaultLabel={`Tahun ini (${formatDate(period.from)} – ${formatDate(period.to)})`}
      />
      {analytics.error ? (
        <Alert variant="destructive">
          <AlertDescription>Analitik gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <>
          <AnalyticsSummary overall={analytics.overall} />
          <div className="grid gap-4 xl:grid-cols-2">
            <WinRateTable title="Per klien" keyLabel="Klien" rows={analytics.perClient} />
            <WinRateTable title="Per tegangan" keyLabel="Tegangan" rows={analytics.perVoltage} />
            <LostReasonsTable rows={analytics.lostReasons} />
            <PipelineTable rows={analytics.pipeline} />
          </div>
        </>
      )}
    </div>
  );
}
