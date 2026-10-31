import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ReportDayPicker } from "@/components/daily-reports/report-day-picker";
import { ReportForm } from "@/components/daily-reports/report-form";
import { NoAssignment } from "@/components/field/no-assignment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { canEditReport, fieldReportDates, reportProjects, workforceOn } from "@/lib/daily-reports/context";
import { REPORT_MANAGE_ROLES, REPORT_STATUS_LABELS } from "@/lib/daily-reports/labels";
import { reportForDay, reportFormContext } from "@/lib/daily-reports/queries";
import { formatDate, todayWib } from "@/lib/format";
import { parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Laporan Harian" };

type SearchParams = Promise<RawSearchParams>;

export default function NewDailyReportPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Laporan Harian" description="Satu laporan per proyek per tanggal. Foto ditambahkan setelah laporan dikirim." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewDailyReportContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewDailyReportContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(REPORT_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;

  const projects = await reportProjects(profile);
  if (!projects.length) return profile.role === "field" ? <NoAssignment /> : null;

  const raw = await searchParams;
  const today = todayWib();
  const dates = profile.role === "field" ? await fieldReportDates() : null;
  const rawProject = parseText(raw.project);
  const projectId = projects.find((project) => project.value === rawProject)?.value ?? projects[0].value;
  const rawDate = parseText(raw.date);
  const date = dates
    ? (dates.find((option) => option.value === rawDate)?.value ?? today)
    : rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate <= today
      ? rawDate
      : today;

  const existing = await reportForDay(projectId, date);
  const picker = <ReportDayPicker projectId={projectId} date={date} projects={projects} dates={dates} today={today} />;

  if (existing) {
    const editable = await canEditReport(profile, existing);
    return (
      <div className="flex flex-col gap-4">
        {picker}
        <Alert>
          <AlertTitle>Laporan {formatDate(date)} sudah dikirim</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            Status: {REPORT_STATUS_LABELS[existing.status]}.
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/operations/daily-reports/${existing.id}`}>Lihat laporan</Link>
              </Button>
              {editable ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/field/daily-reports/${existing.id}/edit`}>Ubah laporan</Link>
                </Button>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [context, workforce] = await Promise.all([reportFormContext(projectId), workforceOn(projectId, date)]);

  return (
    <div className="flex flex-col gap-4">
      {picker}
      <ReportForm
        key={`${projectId}-${date}`}
        projectId={projectId}
        reportDate={date}
        editing={false}
        sections={context.sections}
        stages={context.stages}
        current={context.current}
        workforce={workforce}
        cancelHref={profile.role === "field" ? "/" : "/operations/daily-reports"}
      />
    </div>
  );
}
