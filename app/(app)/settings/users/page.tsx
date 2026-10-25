import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { UsersTable } from "@/components/users/users-table";
import { UsersToolbar } from "@/components/users/users-toolbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { employeeLinkOptions } from "@/lib/employees/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { parseUserListParams, queryUsers } from "@/lib/users/queries";

export const metadata: Metadata = { title: "Pengguna & Peran" };

type SearchParams = Promise<RawSearchParams>;

export default function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Pengguna & Peran"
        description="Akun dibuat lewat undangan email. Satu akun memiliki satu peran."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UsersContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(["super_admin", "director"]);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseUserListParams(raw);
  const canManage = profile.role === "super_admin";
  const [{ rows, count, error }, employeeOptions] = await Promise.all([
    queryUsers(params, { page: params.page }),
    canManage ? employeeLinkOptions() : [],
  ]);

  return (
    <div className="flex flex-col gap-4">
      <UsersToolbar canManage={canManage} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar pengguna gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <UsersTable
          users={rows}
          canManage={canManage}
          currentUserId={profile.id}
          employeeOptions={employeeOptions}
        />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/settings/users", page)}
      />
    </div>
  );
}
