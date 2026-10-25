import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { EmployeesTable } from "@/components/employees/employees-table";
import { EmployeesToolbar } from "@/components/employees/employees-toolbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { EMPLOYEE_VIEW_ROLES } from "@/lib/employees/labels";
import {
  parseEmployeeListParams,
  positionOptions,
  queryEmployees,
} from "@/lib/employees/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Karyawan" };

type SearchParams = Promise<RawSearchParams>;

export default function EmployeesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Karyawan"
        description="Data karyawan kantor dan lapangan. Karyawan nonaktif tidak dapat ditugaskan atau diabsen."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <EmployeesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EmployeesContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(EMPLOYEE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseEmployeeListParams(raw);
  const [{ rows, count, error }, positions] = await Promise.all([
    queryEmployees(params, { page: params.page }),
    positionOptions(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <EmployeesToolbar
        positions={positions.map(({ value, label }) => ({ value, label }))}
        canManage={profile.role === "hcm"}
      />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar karyawan gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <EmployeesTable employees={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/hr/employees", page)}
      />
    </div>
  );
}
