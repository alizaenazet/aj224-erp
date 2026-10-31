import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { requireRole } from "@/lib/auth/session";
import { clientOptions } from "@/lib/clients/queries";
import { PROJECT_MANAGE_ROLES } from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Ubah Proyek" };

type Params = Promise<{ id: string }>;

export default function EditProjectPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader title="Ubah Proyek" description="Data kontrak diubah di tab Kontrak & Termin." />
      <Suspense fallback={<ContentSkeleton />}>
        <EditProjectContent params={params} />
      </Suspense>
    </>
  );
}

async function EditProjectContent({ params }: { params: Params }) {
  const profile = await requireRole(PROJECT_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const clients = await clientOptions({ includeId: project.client_id });

  return (
    <ProjectForm
      projectId={project.id}
      clients={clients}
      lockClient={Boolean(project.tender_id)}
      defaultValues={{
        project: {
          name: project.name,
          client_id: project.client_id,
          end_owner: project.end_owner,
          site: project.site,
          voltage_kv: project.voltage_kv as 150 | 275 | 500 | null,
          length_kms: project.length_kms,
          tower_count: project.tower_count,
          start_date: project.start_date,
          target_finish_date: project.target_finish_date,
          notes: project.notes,
        },
      }}
    />
  );
}
