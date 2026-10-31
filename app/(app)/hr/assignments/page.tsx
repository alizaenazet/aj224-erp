import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { AssignmentsTable, AssignmentsToolbar } from "@/components/assignments/assignments-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ASSIGNMENT_VIEW_ROLES } from "@/lib/assignments/labels";
import {
  assignableEmployees,
  assignableProjects,
  assignmentProjectOptions,
  parseAssignmentListParams,
  queryAssignments,
} from "@/lib/assignments/queries";
import { requireRole } from "@/lib/auth/session";
import { positionOptions } from "@/lib/employees/queries";
import { todayWib } from "@/lib/format";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Penugasan" };

type SearchParams = Promise<RawSearchParams>;

export default function AssignmentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Penugasan"
        description="Penugasan karyawan ke proyek. Sertifikat wajib jabatan diperiksa saat penugasan dibuat."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <AssignmentsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AssignmentsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(ASSIGNMENT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseAssignmentListParams(raw);
  const canManage = profile.role === "hcm";
  const [{ rows, count, error }, projects, formOptions] = await Promise.all([
    queryAssignments(params, { page: params.page }),
    assignmentProjectOptions(),
    canManage
      ? Promise.all([assignableEmployees(), assignableProjects(), positionOptions()]).then(
          ([employees, assignable, positions]) => ({
            employees,
            projects: assignable,
            positions: positions.filter((position) => position.active),
          }),
        )
      : Promise.resolve(null),
  ]);
  const today = todayWib();

  return (
    <div className="flex flex-col gap-4">
      <AssignmentsToolbar projects={projects} canManage={canManage} formOptions={formOptions} today={today} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar penugasan gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <AssignmentsTable assignments={rows} canManage={canManage} today={today} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/hr/assignments", page)}
      />
    </div>
  );
}
