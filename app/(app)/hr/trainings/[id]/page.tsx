import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ParticipantsCard } from "@/components/trainings/participants-card";
import { TrainingActions } from "@/components/trainings/training-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { CERTIFICATE_VIEW_ROLES } from "@/lib/certifications/labels";
import { TRAINING_KIND_LABELS, formatTrainingDates } from "@/lib/trainings/labels";
import { employeeOptions, getTraining } from "@/lib/trainings/queries";

export const metadata: Metadata = { title: "Detail Pelatihan" };

type Params = Promise<{ id: string }>;

export default function TrainingDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <TrainingDetailContent params={params} />
    </Suspense>
  );
}

async function TrainingDetailContent({ params }: { params: Params }) {
  const profile = await requireRole(CERTIFICATE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const { id } = await params;
  const canManage = profile.role === "hcm";
  const [result, employees] = await Promise.all([getTraining(id), canManage ? employeeOptions() : []]);
  if (!result) notFound();
  const { training, participants } = result;

  const details: [string, string][] = [
    ["Jenis", TRAINING_KIND_LABELS[training.kind]],
    ["Penyelenggara", training.organizer ?? "—"],
    ["Tanggal", formatTrainingDates(training.start_date, training.end_date)],
    ["Lokasi", training.location ?? "—"],
    ["Sertifikat yang dihasilkan", training.certificate_type?.name ?? "Tanpa sertifikat"],
    ["Catatan", training.notes ?? "—"],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={training.name}
        description={`${TRAINING_KIND_LABELS[training.kind]} · ${formatTrainingDates(training.start_date, training.end_date)}`}
        actions={canManage ? <TrainingActions trainingId={training.id} name={training.name} /> : null}
      />
      <Card>
        <CardHeader>
          <CardTitle>Data pelatihan</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <ParticipantsCard
        trainingId={training.id}
        certificateTypeName={training.certificate_type?.name ?? null}
        participants={participants}
        employees={employees}
        canManage={canManage}
      />
    </div>
  );
}
