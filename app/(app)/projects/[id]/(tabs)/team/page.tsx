import type { Metadata } from "next";
import { CalendarCheckIcon, UserRoundCheckIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { MobileList } from "@/components/app/mobile-list";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { DateParamPicker } from "@/components/app/date-param-picker";
import { CertStateBadge } from "@/components/assignments/cert-state-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ASSIGNMENT_VIEW_ROLES } from "@/lib/assignments/labels";
import { projectCrew } from "@/lib/assignments/queries";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_VARIANTS,
  TEAM_VIEW_ROLES,
} from "@/lib/attendance/labels";
import { projectDayRecords } from "@/lib/attendance/queries";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { EMPLOYEE_VIEW_ROLES, VERIFICATION_LABELS } from "@/lib/employees/labels";
import { formatDate, formatNumber, todayWib } from "@/lib/format";
import { parseText, type RawSearchParams } from "@/lib/list/params";
import { PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Tim & Absensi" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<RawSearchParams>;

export default function ProjectTeamPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectTeam params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Tim & Absensi tab: crew with certificate state (HCM-05, HCM-06) and a day's attendance (HCM-09). */
async function ProjectTeam({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, TEAM_VIEW_ROLES)) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const today = todayWib();
  const rawDate = parseText((await searchParams).date);
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && rawDate <= today ? rawDate : today;
  const seesCrew = hasAnyRole(profile.role, [...ASSIGNMENT_VIEW_ROLES, "field"]);
  const linksEmployees = hasAnyRole(profile.role, EMPLOYEE_VIEW_ROLES);
  const [crew, records] = await Promise.all([
    seesCrew ? projectCrew(project.id, today) : Promise.resolve([]),
    projectDayRecords(project.id, date),
  ]);
  const counts = ATTENDANCE_STATUSES.map((status) => ({
    status,
    count: records.filter((record) => record.status === status).length,
  })).filter((item) => item.count > 0);
  const entryHref =
    profile.role === "hcm"
      ? `/hr/attendance?scope=${project.id}&date=${date}`
      : profile.role === "field"
        ? `/field/attendance?project=${project.id}`
        : null;

  return (
    <div className="flex flex-col gap-4">
      {seesCrew ? (
        <Card>
          <CardHeader>
            <CardTitle>Kru aktif hari ini</CardTitle>
            <CardDescription>
              Dari penugasan aktif. Merah: sertifikat wajib kedaluwarsa atau belum ada selama penugasan.
            </CardDescription>
            {profile.role === "hcm" ? (
              <CardAction>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/hr/assignments?project=${project.id}`}>
                    <UserRoundCheckIcon />
                    Kelola penugasan
                  </Link>
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            {crew.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada kru</EmptyTitle>
                  <EmptyDescription>Kru ditugaskan oleh HCM di SDM → Penugasan.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Sejak</TableHead>
                        <TableHead>Sertifikat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crew.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {linksEmployees ? (
                                <Link
                                  href={`/hr/employees/${member.employee_id}`}
                                  className="font-medium underline-offset-4 hover:underline"
                                >
                                  {member.employee_name}
                                </Link>
                              ) : (
                                <span className="font-medium">{member.employee_name}</span>
                              )}
                              <span className="text-xs text-muted-foreground">{member.employee_no}</span>
                            </div>
                          </TableCell>
                          <TableCell>{member.position_name}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(member.start_date)}</TableCell>
                          <TableCell>
                            <div className="flex max-w-72 flex-wrap gap-1 whitespace-normal">
                              {member.cert_state ? (
                                <CertStateBadge state={member.cert_state} issues={member.cert_issues} />
                              ) : (
                                <span className="text-muted-foreground">Tidak wajib</span>
                              )}
                              {member.overridden_at ? <Badge variant="destructive">Override</Badge> : null}
                              {member.verification_status === "pending" ? (
                                <Badge variant="warning">{VERIFICATION_LABELS.pending}</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <MobileList
                  rows={crew.map((member) => ({
                    key: member.id,
                    title: (
                      <>
                        {linksEmployees ? (
                          <Link href={`/hr/employees/${member.employee_id}`} className="underline-offset-4 hover:underline">
                            {member.employee_name}
                          </Link>
                        ) : (
                          member.employee_name
                        )}
                        <span className="text-xs font-normal text-muted-foreground">{member.employee_no}</span>
                      </>
                    ),
                    fields: [
                      { key: "position", label: "Jabatan", value: member.position_name },
                      { key: "since", label: "Sejak", value: formatDate(member.start_date) },
                      {
                        key: "cert",
                        label: "Sertifikat",
                        full: true,
                        value: (
                          <div className="flex flex-wrap gap-1">
                            {member.cert_state ? (
                              <CertStateBadge state={member.cert_state} issues={member.cert_issues} />
                            ) : (
                              <span className="text-muted-foreground">Tidak wajib</span>
                            )}
                            {member.overridden_at ? <Badge variant="destructive">Override</Badge> : null}
                            {member.verification_status === "pending" ? <Badge variant="warning">{VERIFICATION_LABELS.pending}</Badge> : null}
                          </div>
                        ),
                      },
                    ],
                  }))}
                />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Absensi {formatDate(date)}</CardTitle>
          <CardDescription>
            {records.length
              ? counts.map((item) => `${ATTENDANCE_STATUS_LABELS[item.status]} ${item.count}`).join(" · ")
              : "Belum ada absensi tercatat untuk tanggal ini."}
          </CardDescription>
          {entryHref ? (
            <CardAction>
              <Button asChild size="sm">
                <Link href={entryHref}>
                  <CalendarCheckIcon />
                  Isi absensi
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DateParamPicker id="team-date" label="Tanggal" value={date} max={today} />
          {records.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Lembur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.employee_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.employee_name}</span>
                        <span className="text-xs text-muted-foreground">{record.employee_no}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ATTENDANCE_STATUS_VARIANTS[record.status]}>
                        {ATTENDANCE_STATUS_LABELS[record.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {record.overtime_hours ? `${formatNumber(record.overtime_hours, 1)} jam` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
