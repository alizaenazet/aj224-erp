import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { LocalWorkerForm } from "@/components/field/local-worker-form";
import { NoAssignment } from "@/components/field/no-assignment";
import { requireRole } from "@/lib/auth/session";
import { fieldProjects, localWorkerPositions } from "@/lib/field/queries";

export const metadata: Metadata = { title: "Tambah Pekerja Lokal" };

export default function NewLocalWorkerPage() {
  return (
    <>
      <PageHeader title="Tambah Pekerja Lokal" description="Data minimal pekerja yang direkrut di lokasi proyek." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewLocalWorkerContent />
      </Suspense>
    </>
  );
}

async function NewLocalWorkerContent() {
  const profile = await requireRole(["field"]);
  if (!profile) return <AccessDenied />;

  const [projects, positions] = await Promise.all([fieldProjects(), localWorkerPositions()]);
  if (!projects.length) return <NoAssignment />;

  return (
    <LocalWorkerForm
      projects={projects.map((project) => ({ value: project.id, label: `${project.code} — ${project.name}` }))}
      positions={positions}
    />
  );
}
