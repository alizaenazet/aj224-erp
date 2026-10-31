import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { FieldAttendancePicker } from "@/components/field/field-attendance-picker";
import { NoAssignment } from "@/components/field/no-assignment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttachments } from "@/lib/attachments/queries";
import { projectSheet } from "@/lib/attendance/queries";
import { requireRole } from "@/lib/auth/session";
import { backdateDays } from "@/lib/daily-reports/queries";
import { fieldProjects } from "@/lib/field/queries";
import { formatDate, todayWib } from "@/lib/format";
import { parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Absensi Hari Ini" };

type SearchParams = Promise<RawSearchParams>;

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function FieldAttendancePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Absensi Hari Ini" description="Tandai kehadiran kru proyek Anda. Input mundur dibatasi beberapa hari." />
      <Suspense fallback={<ContentSkeleton />}>
        <FieldAttendanceContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function FieldAttendanceContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(["field"]);
  if (!profile) return <AccessDenied />;

  const projects = await fieldProjects();
  if (!projects.length) return <NoAssignment />;

  const raw = await searchParams;
  const today = todayWib();
  const dates = Array.from({ length: (await backdateDays()) + 1 }, (_, index) => {
    const value = addDays(today, -index);
    return { value, label: index === 0 ? `Hari ini, ${formatDate(value)}` : index === 1 ? `Kemarin, ${formatDate(value)}` : formatDate(value) };
  });
  const rawProject = parseText(raw.project);
  const project = projects.find((item) => item.id === rawProject) ?? projects[0];
  const rawDate = parseText(raw.date);
  const date = dates.some((option) => option.value === rawDate) ? (rawDate as string) : today;

  const sheet = await projectSheet(project.id, date);
  const photos = sheet.dayId ? await listAttachments("attendance_day", sheet.dayId) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{project.code}</span>
        <span className="font-medium">{project.name}</span>
      </div>
      <FieldAttendancePicker
        projectId={project.id}
        date={date}
        projects={projects.map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` }))}
        dates={dates}
      />
      <AttendanceSheet key={`${project.id}-${date}`} projectId={project.id} date={date} people={sheet.people} canEdit field />
      <Card>
        <CardHeader>
          <CardTitle>Foto lembar absensi</CardTitle>
          <CardDescription>Opsional: foto lembar absensi kertas yang ditandatangani mandor.</CardDescription>
        </CardHeader>
        <CardContent>
          {sheet.dayId && photos ? (
            <AttachmentList
              entityType="attendance_day"
              entityId={sheet.dayId}
              attachments={photos.rows}
              categories={["sheet"]}
              canManage
            />
          ) : (
            <p className="text-sm text-muted-foreground">Simpan absensi dulu untuk melampirkan foto.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
