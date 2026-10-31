import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { RecapTable, RecapToolbar } from "@/components/attendance/recap-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ATTENDANCE_OFFICE_VIEW_ROLES } from "@/lib/attendance/labels";
import { attendanceProjectOptions, parseRecapParams, queryRecap } from "@/lib/attendance/queries";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import type { RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Rekap Absensi" };

type SearchParams = Promise<RawSearchParams>;

export default function AttendanceRecapPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Rekap Absensi" description="Jumlah hari per status dan jam lembur per karyawan dan proyek." />
      <Suspense fallback={<ContentSkeleton />}>
        <RecapContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function RecapContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(ATTENDANCE_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const params = parseRecapParams(await searchParams);
  const [{ rows, error }, projects] = await Promise.all([queryRecap(params), attendanceProjectOptions()]);

  return (
    <div className="flex flex-col gap-4">
      <RecapToolbar projects={projects} />
      <p className="text-sm text-muted-foreground">
        Periode {formatDate(params.from)} – {formatDate(params.to)} · {rows.length} baris. Penguncian periode setelah
        payroll disetujui berlaku sejak modul payroll aktif.
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Rekap gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <RecapTable rows={rows} />
      )}
    </div>
  );
}
