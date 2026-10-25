import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { EmployeeForm } from "@/components/employees/employee-form";
import { requireRole } from "@/lib/auth/session";
import { positionOptions } from "@/lib/employees/queries";

export const metadata: Metadata = { title: "Tambah Karyawan" };

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader title="Tambah Karyawan" description="Kolom bertanda * wajib diisi." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewEmployeeContent />
      </Suspense>
    </>
  );
}

async function NewEmployeeContent() {
  const profile = await requireRole(["hcm"]);
  if (!profile) return <AccessDenied />;

  const positions = await positionOptions();
  return (
    <EmployeeForm
      positions={positions.filter((position) => position.active).map(({ value, label }) => ({ value, label }))}
    />
  );
}
