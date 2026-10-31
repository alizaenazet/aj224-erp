import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { Letterhead } from "@/components/print/letterhead";
import { PrintPage } from "@/components/print/print-page";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { OBSTACLE_LABELS, REPORT_VIEW_ROLES, describeWeather } from "@/lib/daily-reports/labels";
import { getReport, reportActivities, reportObstacles, reportPhotoUrls } from "@/lib/daily-reports/queries";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { peopleNames } from "@/lib/people";

export const metadata: Metadata = { title: "Cetak Laporan Harian" };

type Params = Promise<{ id: string }>;

export default function PrintDailyReportPage({ params }: { params: Params }) {
  return (
    <>
      <PrintToolbar />
      <Suspense fallback={<ContentSkeleton />}>
        <PrintDailyReport params={params} />
      </Suspense>
    </>
  );
}

/** Laporan harian A4 (OPS-04): report on one page, photos on attachment pages. */
async function PrintDailyReport({ params }: { params: Params }) {
  const profile = await requireRole(REPORT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const report = await getReport((await params).id);
  if (!report) notFound();

  const [activities, obstacles, photos, names] = await Promise.all([
    reportActivities(report.id),
    reportObstacles(report.id),
    reportPhotoUrls(report.id),
    peopleNames(),
  ]);
  const header: [string, string][] = [
    ["Proyek", `${report.project_code} — ${report.project_name}`],
    ["Tanggal", formatDate(report.report_date)],
    ["Cuaca (pagi · siang · sore)", describeWeather(report)],
    ["Jam kerja efektif", report.effective_hours === null ? "—" : `${formatNumber(Number(report.effective_hours), 1)} jam`],
    ["Tenaga kerja", `${formatNumber(report.workforce)} orang`],
    ["Safety briefing", report.safety_briefing ? `Ya, ${formatNumber(report.briefing_participants ?? 0)} peserta` : "Tidak"],
  ];

  return (
    <>
      <PrintPage>
        <Letterhead />
        <h1 className="text-center text-lg font-semibold">LAPORAN HARIAN</h1>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {header.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {report.no_activity ? (
          <section className="flex flex-col gap-1 text-sm">
            <h2 className="font-semibold">Tidak Ada Kegiatan</h2>
            <p>{report.no_activity_reason}</p>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-2 text-sm">
              <h2 className="font-semibold">Aktivitas</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seksi</TableHead>
                    <TableHead>Tahapan</TableHead>
                    <TableHead className="text-right">Progres kumulatif</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={`${activity.section_id}-${activity.stage_id}`}>
                      <TableCell>{activity.section_code}</TableCell>
                      <TableCell>{activity.stage_name}</TableCell>
                      <TableCell className="text-right">{formatNumber(activity.progress_after, 2)}%</TableCell>
                      <TableCell className="whitespace-normal">{activity.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
            <section className="flex flex-col gap-1 text-sm">
              <h2 className="font-semibold">Kendala</h2>
              {obstacles.length ? (
                <ul className="flex flex-col gap-1">
                  {obstacles.map((obstacle, index) => (
                    <li key={index}>
                      <span className="font-medium">{OBSTACLE_LABELS[obstacle.category]}:</span> {obstacle.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Tidak ada.</p>
              )}
            </section>
            <section className="flex flex-col gap-1 text-sm">
              <h2 className="font-semibold">Alat utama</h2>
              <p className="whitespace-pre-line">{report.equipment_used ?? "—"}</p>
            </section>
          </>
        )}
        <section className="flex flex-col gap-1 text-sm">
          <h2 className="font-semibold">Rencana esok hari</h2>
          <p className="whitespace-pre-line">{report.plan_tomorrow ?? "—"}</p>
        </section>
        {report.notes ? (
          <section className="flex flex-col gap-1 text-sm">
            <h2 className="font-semibold">Catatan</h2>
            <p className="whitespace-pre-line">{report.notes}</p>
          </section>
        ) : null}
        <div className="grid grid-cols-2 gap-6 pt-6 text-sm">
          <div className="flex flex-col gap-12">
            <span>Dibuat oleh,</span>
            <span className="font-medium">{report.submitted_by ? (names.get(report.submitted_by) ?? "—") : "—"}</span>
          </div>
          <div className="flex flex-col gap-12">
            <span>Diperiksa oleh,</span>
            <span className="font-medium">
              {report.status === "reviewed" && report.reviewed_by ? (names.get(report.reviewed_by) ?? "—") : "________________"}
            </span>
          </div>
        </div>
      </PrintPage>

      {photos.length ? (
        <div className="print:break-before-page">
          <PrintPage>
            <h2 className="text-base font-semibold">
              Lampiran foto — {report.project_code}, {formatDate(report.report_date)}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, index) =>
                photo.url ? (
                  <figure key={index} className="flex flex-col gap-1 break-inside-avoid">
                    {/* Signed URL from private storage; plain img prints reliably. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`Foto ${index + 1} ${photo.file_name}`} className="w-full rounded-md border" />
                    <figcaption className="text-xs text-muted-foreground">
                      Foto {index + 1} · {formatDateTime(photo.created_at)}
                    </figcaption>
                  </figure>
                ) : null,
              )}
            </div>
          </PrintPage>
        </div>
      ) : null}
    </>
  );
}
