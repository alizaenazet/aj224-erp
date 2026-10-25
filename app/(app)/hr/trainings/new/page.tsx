import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TrainingForm } from "@/components/trainings/training-form";
import { requireRole } from "@/lib/auth/session";
import { certificateTypeOptions } from "@/lib/certifications/queries";
import { isUuid, parseText, type RawSearchParams } from "@/lib/list/params";
import { employeeOptions } from "@/lib/trainings/queries";

export const metadata: Metadata = { title: "Tambah Pelatihan" };

type SearchParams = Promise<RawSearchParams>;

export default function NewTrainingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Tambah Pelatihan" description="Kolom bertanda * wajib diisi." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewTrainingContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewTrainingContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(["hcm"]);
  if (!profile) return <AccessDenied />;

  // Prefill from Kebutuhan Pelatihan: ?certificate_type=<id>&employees=<id,id>
  const raw = await searchParams;
  const certificateType = parseText(raw.certificate_type);
  const requested = (parseText(raw.employees) ?? "").split(",").filter(isUuid);

  const [types, employees] = await Promise.all([certificateTypeOptions(), employeeOptions()]);
  const activeTypes = types.filter((type) => type.active);
  const typeId = activeTypes.some((type) => type.value === certificateType) ? certificateType : null;
  const typeName = activeTypes.find((type) => type.value === typeId)?.label;

  return (
    <TrainingForm
      certificateTypes={activeTypes.map(({ value, label }) => ({ value, label }))}
      employees={employees}
      initialParticipants={requested.filter((id) => employees.some((employee) => employee.id === id))}
      defaultValues={typeId ? { certificate_type_id: typeId, name: `Pelatihan ${typeName}` } : undefined}
    />
  );
}
