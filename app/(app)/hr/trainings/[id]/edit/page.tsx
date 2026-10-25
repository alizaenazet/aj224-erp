import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TrainingForm } from "@/components/trainings/training-form";
import { requireRole } from "@/lib/auth/session";
import { certificateTypeOptions } from "@/lib/certifications/queries";
import { getTraining } from "@/lib/trainings/queries";

export const metadata: Metadata = { title: "Ubah Pelatihan" };

type Params = Promise<{ id: string }>;

export default function EditTrainingPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <EditTrainingContent params={params} />
    </Suspense>
  );
}

async function EditTrainingContent({ params }: { params: Params }) {
  const profile = await requireRole(["hcm"]);
  if (!profile) return <AccessDenied />;

  const { id } = await params;
  const [result, types] = await Promise.all([getTraining(id), certificateTypeOptions()]);
  if (!result) notFound();
  const { training } = result;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Ubah ${training.name}`} description="Kolom bertanda * wajib diisi." />
      <TrainingForm
        trainingId={training.id}
        certificateTypes={types
          .filter((type) => type.active || type.value === training.certificate_type_id)
          .map(({ value, label }) => ({ value, label }))}
        defaultValues={{
          name: training.name,
          kind: training.kind,
          organizer: training.organizer,
          start_date: training.start_date,
          end_date: training.end_date,
          location: training.location,
          certificate_type_id: training.certificate_type_id,
          notes: training.notes,
        }}
      />
    </div>
  );
}
