import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ReportForm } from "@/components/daily-reports/report-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { canEditReport, workforceOn } from "@/lib/daily-reports/context";
import { REPORT_MANAGE_ROLES } from "@/lib/daily-reports/labels";
import { getReport, reportActivities, reportFormContext, reportObstacles } from "@/lib/daily-reports/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah Laporan Harian" };

type Params = Promise<{ id: string }>;

export default function EditDailyReportPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader title="Ubah Laporan Harian" description="Progres hanya bisa naik; koreksi turun dilakukan Operasional." />
      <Suspense fallback={<ContentSkeleton />}>
        <EditDailyReportContent params={params} />
      </Suspense>
    </>
  );
}

async function EditDailyReportContent({ params }: { params: Params }) {
  const profile = await requireRole(REPORT_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;

  const report = await getReport((await params).id);
  if (!report) notFound();
  if (!(await canEditReport(profile, report))) {
    return (
      <Alert>
        <AlertTitle>Laporan tidak dapat diubah</AlertTitle>
        <AlertDescription>Laporan sudah diperiksa atau melewati batas input. Hubungi Operasional.</AlertDescription>
      </Alert>
    );
  }

  const [context, activities, obstacles, workforce] = await Promise.all([
    reportFormContext(report.project_id),
    reportActivities(report.id),
    reportObstacles(report.id),
    workforceOn(report.project_id, report.report_date),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">
          {report.project_code} · {formatDate(report.report_date)}
        </span>
        <span className="font-medium">{report.project_name}</span>
      </div>
      {report.status === "revision" && report.review_comment ? (
        <Alert variant="warning">
          <AlertTitle>Perlu revisi</AlertTitle>
          <AlertDescription>{report.review_comment}</AlertDescription>
        </Alert>
      ) : null}
      <ReportForm
        projectId={report.project_id}
        reportDate={report.report_date}
        editing
        sections={context.sections}
        stages={context.stages}
        current={context.current}
        workforce={workforce}
        cancelHref={`/operations/daily-reports/${report.id}`}
        defaultValues={{
          no_activity: report.no_activity,
          no_activity_reason: report.no_activity_reason,
          weather_morning: report.weather_morning,
          weather_midday: report.weather_midday,
          weather_afternoon: report.weather_afternoon,
          effective_hours: report.effective_hours === null ? null : Number(report.effective_hours),
          safety_briefing: report.safety_briefing,
          briefing_participants: report.briefing_participants,
          equipment_used: report.equipment_used,
          plan_tomorrow: report.plan_tomorrow,
          notes: report.notes,
          activities: activities.map((activity) => ({
            section_id: activity.section_id,
            stage_id: activity.stage_id,
            progress_after: activity.progress_after,
            notes: activity.notes,
          })),
          obstacles,
        }}
      />
    </div>
  );
}
