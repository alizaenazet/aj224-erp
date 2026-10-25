import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { CertificatesTable, CertificatesToolbar } from "@/components/certifications/certificates-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { CERTIFICATE_VIEW_ROLES } from "@/lib/certifications/labels";
import {
  certificateTypeOptions,
  parseCertificateListParams,
  queryCertificates,
} from "@/lib/certifications/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Sertifikat" };

type SearchParams = Promise<RawSearchParams>;

export default function CertificatesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Sertifikat"
        description="Sertifikat terbaru per karyawan aktif. Status dihitung otomatis dari tanggal kedaluwarsa."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <CertificatesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function CertificatesContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(CERTIFICATE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseCertificateListParams(raw);
  const [{ rows, count, error }, types] = await Promise.all([
    queryCertificates(params, { page: params.page }),
    certificateTypeOptions(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <CertificatesToolbar types={types.map(({ value, label }) => ({ value, label }))} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar sertifikat gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <CertificatesTable certificates={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/hr/certificates", page)}
      />
    </div>
  );
}
