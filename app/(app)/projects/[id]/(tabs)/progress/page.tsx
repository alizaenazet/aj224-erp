import type { Metadata } from "next";
import { HistoryIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ProgressCurve } from "@/components/progress/progress-curve";
import { ProgressMatrix } from "@/components/progress/progress-matrix";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { formatDateTime, formatNumber } from "@/lib/format";
import {
  PROGRESS_MANAGE_ROLES,
  PROGRESS_SOURCE_LABELS,
  PROGRESS_VIEW_ROLES,
  formatDeviation,
  formatProgress,
} from "@/lib/progress/labels";
import {
  progressCells,
  progressCurve,
  progressLog,
  projectProgress,
  projectSections,
  projectStages,
} from "@/lib/progress/queries";
import { PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Seksi & Progres" };

type Params = Promise<{ id: string }>;

export default function ProjectProgressPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectProgressContent params={params} />
    </Suspense>
  );
}

/** Seksi & Progres tab (PRJ-05 … PRJ-08, PRD §11.2). */
async function ProjectProgressContent({ params }: { params: Params }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, PROGRESS_VIEW_ROLES)) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const [stages, sections, summary, log, curve] = await Promise.all([
    projectStages(project.id),
    projectSections(project.id),
    projectProgress(project.id),
    progressLog(project.id),
    progressCurve(project.id),
  ]);
  const cells = await progressCells(sections.map((section) => section.id));
  const canManage = hasAnyRole(profile.role, PROGRESS_MANAGE_ROLES) && project.status !== "closed";

  const tiles = [
    {
      label: "Progres aktual",
      value: formatProgress(summary?.progress),
      extra: <Progress value={summary?.progress ?? 0} />,
    },
    { label: "Rencana hari ini", value: formatProgress(summary?.planned_progress), extra: null },
    {
      label: "Deviasi jadwal",
      value: formatDeviation(summary?.deviation),
      extra: <span className="text-xs text-muted-foreground">Aktual − rencana</span>,
    },
    {
      label: "Total panjang",
      value: `${formatNumber(summary?.total_kms ?? 0, 3)} kms`,
      extra: <span className="text-xs text-muted-foreground">{summary?.section_count ?? 0} seksi</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {project.status === "closed" ? (
        <Alert>
          <AlertDescription>Proyek sudah ditutup; seksi dan progres hanya dapat dilihat.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader>
              <CardDescription>{tile.label}</CardDescription>
              <CardTitle className="text-xl whitespace-nowrap tabular-nums">{tile.value}</CardTitle>
            </CardHeader>
            {tile.extra ? <CardContent>{tile.extra}</CardContent> : null}
          </Card>
        ))}
      </div>

      <ProgressMatrix
        projectId={project.id}
        stages={stages}
        sections={sections}
        cells={cells}
        summary={summary}
        canManage={canManage}
      />

      <Card>
        <CardHeader>
          <CardTitle>Kurva rencana vs realisasi</CardTitle>
          <CardDescription>
            Rencana dari jadwal seksi (linear antara rencana mulai dan selesai); realisasi dari riwayat progres per akhir
            minggu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {curve.length ? (
            <ProgressCurve points={curve} />
          ) : (
            <p className="text-sm text-muted-foreground">Kurva tampil setelah seksi dengan jadwal rencana ditambahkan.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat progres</CardTitle>
          <CardDescription>50 perubahan terakhir beserta sumbernya.</CardDescription>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon />
                </EmptyMedia>
                <EmptyTitle>Belum ada perubahan progres</EmptyTitle>
                <EmptyDescription>Setiap perubahan progres tahap tercatat di sini.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Seksi</TableHead>
                  <TableHead>Tahapan</TableHead>
                  <TableHead className="text-right">Progres</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Oleh</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(entry.created_at)}</TableCell>
                    <TableCell className="font-medium">{entry.section_code}</TableCell>
                    <TableCell>{entry.stage_name}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatProgress(entry.old_progress, 2)} → {formatProgress(entry.new_progress, 2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{PROGRESS_SOURCE_LABELS[entry.source] ?? entry.source}</Badge>
                    </TableCell>
                    <TableCell>{entry.created_by_name ?? "Sistem"}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal">{entry.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
