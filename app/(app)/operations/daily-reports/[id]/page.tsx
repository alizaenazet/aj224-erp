import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { ReportActions } from "@/components/daily-reports/report-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { canEditReport } from "@/lib/daily-reports/context";
import {
  MAX_REPORT_PHOTOS,
  OBSTACLE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_VARIANTS,
  REPORT_VIEW_ROLES,
  WEATHER_LABELS,
} from "@/lib/daily-reports/labels";
import { getReport, reportActivities, reportObstacles } from "@/lib/daily-reports/queries";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { peopleNames } from "@/lib/people";

export const metadata: Metadata = { title: "Laporan Harian" };

type Params = Promise<{ id: string }>;

export default function DailyReportPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <DailyReportContent params={params} />
    </Suspense>
  );
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words whitespace-pre-line">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One daily report with photos and review (OPS-01, OPS-03). */
async function DailyReportContent({ params }: { params: Params }) {
  const profile = await requireRole(REPORT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const report = await getReport((await params).id);
  if (!report) notFound();

  const [activities, obstacles, photos, names, editable] = await Promise.all([
    reportActivities(report.id),
    reportObstacles(report.id),
    listAttachments("daily_report", report.id),
    peopleNames(),
    canEditReport(profile, report),
  ]);
  const weather = (value: string | null) => (value ? WEATHER_LABELS[value as keyof typeof WEATHER_LABELS] : "—");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Laporan Harian ${formatDate(report.report_date)}`}
        description={`${report.project_code} · ${report.project_name}`}
        actions={<ReportActions report={report} canReview={profile.role === "operations"} canEdit={editable} />}
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant={REPORT_STATUS_VARIANTS[report.status]}>{REPORT_STATUS_LABELS[report.status]}</Badge>
        {report.no_activity ? <Badge variant="outline">Tidak Ada Kegiatan</Badge> : null}
        <Link href={`/projects/${report.project_id}/reports`} className="text-sm underline-offset-4 hover:underline">
          Semua laporan proyek
        </Link>
      </div>

      {report.status === "revision" && report.review_comment ? (
        <Alert variant="warning">
          <AlertTitle>Perlu revisi</AlertTitle>
          <AlertDescription>{report.review_comment}</AlertDescription>
        </Alert>
      ) : null}
      {report.no_activity ? (
        <Alert>
          <AlertTitle>Tidak Ada Kegiatan</AlertTitle>
          <AlertDescription>{report.no_activity_reason}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Cuaca, jam kerja & K3</CardTitle>
        </CardHeader>
        <CardContent>
          <Rows
            rows={[
              ["Cuaca pagi · siang · sore", `${weather(report.weather_morning)} · ${weather(report.weather_midday)} · ${weather(report.weather_afternoon)}`],
              ["Jam kerja efektif", report.effective_hours === null ? "—" : `${formatNumber(Number(report.effective_hours), 1)} jam`],
              [
                "Safety briefing",
                report.safety_briefing ? `Ya, ${formatNumber(report.briefing_participants ?? 0)} peserta` : "Tidak",
              ],
              ["Tenaga kerja (absensi Hadir)", `${formatNumber(report.workforce)} orang`],
            ]}
          />
        </CardContent>
      </Card>

      {report.no_activity ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas & progres</CardTitle>
            <CardDescription>Progres kumulatif setelah hari ini; tercatat di riwayat progres proyek.</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada aktivitas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seksi</TableHead>
                    <TableHead>Tahapan</TableHead>
                    <TableHead className="text-right">Progres</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={`${activity.section_id}-${activity.stage_id}`}>
                      <TableCell className="font-medium">{activity.section_code}</TableCell>
                      <TableCell>{activity.stage_name}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(activity.progress_after, 2)}%</TableCell>
                      <TableCell className="max-w-72 whitespace-normal">{activity.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {report.no_activity ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Kendala</CardTitle>
          </CardHeader>
          <CardContent>
            {obstacles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada kendala.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {obstacles.map((obstacle, index) => (
                  <li key={index} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                    <Badge variant="outline">{OBSTACLE_LABELS[obstacle.category]}</Badge>
                    <span>{obstacle.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alat & rencana</CardTitle>
        </CardHeader>
        <CardContent>
          <Rows
            rows={[
              ["Alat utama", report.equipment_used ?? "—"],
              ["Rencana esok hari", report.plan_tomorrow ?? "—"],
              ["Catatan", report.notes ?? "—"],
              [
                "Dikirim",
                report.submitted_at
                  ? `${formatDateTime(report.submitted_at)} · ${report.submitted_by ? (names.get(report.submitted_by) ?? "—") : "—"}`
                  : "—",
              ],
              [
                "Diperiksa",
                report.reviewed_at && report.status !== "submitted"
                  ? `${formatDateTime(report.reviewed_at)} · ${report.reviewed_by ? (names.get(report.reviewed_by) ?? "—") : "—"}`
                  : "—",
              ],
            ]}
          />
        </CardContent>
      </Card>

      <Card id="foto">
        <CardHeader>
          <CardTitle>Foto kegiatan</CardTitle>
          <CardDescription>
            1–{MAX_REPORT_PHOTOS} foto; foto diperkecil otomatis di perangkat. {report.photo_count}/{MAX_REPORT_PHOTOS} terunggah.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!report.no_activity && report.photo_count === 0 ? (
            <Alert variant="warning">
              <AlertTitle>Foto belum ada</AlertTitle>
              <AlertDescription>Tambahkan minimal satu foto kegiatan.</AlertDescription>
            </Alert>
          ) : null}
          <AttachmentList
            entityType="daily_report"
            entityId={report.id}
            attachments={photos.rows}
            categories={["photo"]}
            canManage={editable}
          />
        </CardContent>
      </Card>
    </div>
  );
}
