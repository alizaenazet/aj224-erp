import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { AuditLogTable, AuditLogToolbar } from "@/components/audit/audit-log-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auditTablesForRole, parseAuditListParams, queryAuditLog } from "@/lib/audit/queries";
import { requireRole } from "@/lib/auth/session";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Log Audit" };

type SearchParams = Promise<RawSearchParams>;

export default function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Log Audit"
        description="Riwayat perubahan data penting: siapa, kapan, dan apa yang berubah."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <AuditLogContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AuditLogContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(["super_admin", "director"]);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const tables = auditTablesForRole(profile.role);
  const params = parseAuditListParams(raw, tables);
  const { rows, count, error } = await queryAuditLog(params, { page: params.page });

  return (
    <div className="flex flex-col gap-4">
      <AuditLogToolbar tables={tables} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Log audit gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <AuditLogTable entries={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/settings/audit-log", page)}
      />
    </div>
  );
}
