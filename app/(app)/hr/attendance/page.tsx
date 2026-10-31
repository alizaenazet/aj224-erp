import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttendanceScope, OFFICE_SCOPE } from "@/components/attendance/attendance-scope";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttachments } from "@/lib/attachments/queries";
import { ATTENDANCE_OFFICE_VIEW_ROLES } from "@/lib/attendance/labels";
import { attendanceProjectOptions, officeSheet, projectSheet } from "@/lib/attendance/queries";
import { requireRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { isUuid, parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Absensi" };

type SearchParams = Promise<RawSearchParams>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function AttendancePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Absensi"
        description="Absensi harian staf kantor dan kru proyek. Satu catatan per karyawan per tanggal."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <AttendanceContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AttendanceContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(ATTENDANCE_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const today = todayWib();
  const rawDate = parseText(raw.date);
  const date = rawDate && ISO_DATE.test(rawDate) && rawDate <= today ? rawDate : today;
  const rawScope = parseText(raw.scope);
  const projects = await attendanceProjectOptions();
  const scope = rawScope && isUuid(rawScope) && projects.some((project) => project.value === rawScope) ? rawScope : OFFICE_SCOPE;
  const projectId = scope === OFFICE_SCOPE ? null : scope;
  const canEdit = profile.role === "hcm";

  const sheet = projectId ? await projectSheet(projectId, date) : await officeSheet(date);
  const photos = sheet.dayId ? await listAttachments("attendance_day", sheet.dayId) : null;

  return (
    <div className="flex flex-col gap-6">
      <AttendanceScope scope={scope} date={date} today={today} projects={projects} />
      <AttendanceSheet key={`${scope}-${date}`} projectId={projectId} date={date} people={sheet.people} canEdit={canEdit} />
      {projectId ? (
        <Card>
          <CardHeader>
            <CardTitle>Foto lembar absensi</CardTitle>
            <CardDescription>Foto lembar absensi kertas dari lapangan (opsional).</CardDescription>
          </CardHeader>
          <CardContent>
            {sheet.dayId && photos ? (
              <AttachmentList
                entityType="attendance_day"
                entityId={sheet.dayId}
                attachments={photos.rows}
                categories={["sheet"]}
                canManage={canEdit}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Simpan absensi hari ini dulu untuk melampirkan foto.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
