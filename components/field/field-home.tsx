import { CalendarCheckIcon, ClipboardListIcon, TruckIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { NoAssignment } from "@/components/field/no-assignment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fieldProjects } from "@/lib/field/queries";
import { REPORT_STATUS_LABELS, REPORT_STATUS_VARIANTS, type ReportStatus } from "@/lib/daily-reports/labels";
import { formatProgress } from "@/lib/progress/labels";

/** Beranda Lapangan (DSB-04): active projects, quick actions and today's attendance status. */
export async function FieldHome() {
  const projects = await fieldProjects();
  if (!projects.length) return <NoAssignment />;

  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => {
        const done = project.crew_today > 0 && project.recorded_today >= project.crew_today;
        return (
          <Card key={project.id}>
            <CardHeader>
              <CardDescription>{project.code}</CardDescription>
              <CardTitle>
                <Link href={`/projects/${project.id}`} className="underline-offset-4 hover:underline">
                  {project.name}
                </Link>
              </CardTitle>
              <CardDescription>
                {project.site ?? "—"}
                {project.progress === null ? "" : ` · progres ${formatProgress(project.progress)}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>Absensi hari ini</span>
                <span className="font-medium tabular-nums">
                  {project.recorded_today}/{project.crew_today} kru
                </span>
              </div>
              <Progress value={project.crew_today ? (project.recorded_today / project.crew_today) * 100 : 0} />
              <span className="text-xs text-muted-foreground">
                {done ? "Semua kru sudah tercatat." : "Lengkapi absensi kru hari ini."}
              </span>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>Laporan harian</span>
                {project.report_today ? (
                  <Badge variant={REPORT_STATUS_VARIANTS[project.report_today.status as ReportStatus]}>
                    {REPORT_STATUS_LABELS[project.report_today.status as ReportStatus]}
                  </Badge>
                ) : (
                  <Badge variant="outline">Belum dikirim</Badge>
                )}
              </div>
              {project.incoming_notes.length ? (
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>Surat jalan masuk</span>
                  <Badge variant="warning">{project.incoming_notes.length} menunggu diterima</Badge>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="grid gap-2 sm:grid-cols-2">
              <Button asChild size="lg" variant={done ? "outline" : "default"}>
                <Link href={`/field/attendance?project=${project.id}`}>
                  <CalendarCheckIcon />
                  Absensi Hari Ini
                </Link>
              </Button>
              <Button asChild size="lg" variant={project.report_today ? "outline" : "default"}>
                <Link
                  href={
                    project.report_today
                      ? `/operations/daily-reports/${project.report_today.id}`
                      : `/field/daily-reports/new?project=${project.id}`
                  }
                >
                  <ClipboardListIcon />
                  {project.report_today ? "Lihat Laporan Hari Ini" : "Laporan Harian"}
                </Link>
              </Button>
              {project.incoming_notes.length ? (
                <Button asChild size="lg">
                  <Link
                    href={
                      project.incoming_notes.length === 1
                        ? `/operations/delivery-notes/${project.incoming_notes[0].id}`
                        : `/projects/${project.id}/equipment`
                    }
                  >
                    <TruckIcon />
                    Terima Alat
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                size="lg"
                variant="outline"
                className={project.incoming_notes.length ? undefined : "sm:col-span-2"}
              >
                <Link href="/field/workers/new">
                  <UserPlusIcon />
                  Tambah Pekerja Lokal
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
