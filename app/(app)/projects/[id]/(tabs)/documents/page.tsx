import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttachments } from "@/lib/attachments/queries";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import {
  CONTRACT_DOCUMENT_CATEGORIES,
  CONTRACT_VIEW_ROLES,
  PROJECT_DOCUMENT_CATEGORIES,
  PROJECT_DOCUMENT_MANAGE_ROLES,
  PROJECT_VIEW_ROLES,
} from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Dokumen Proyek" };

type Params = Promise<{ id: string }>;

export default function ProjectDocumentsPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectDocuments params={params} />
    </Suspense>
  );
}

/** Dokumen tab (PRJ-10); contract and addendum files only for contract roles. */
async function ProjectDocuments({ params }: { params: Params }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const seesContract = hasAnyRole(profile.role, CONTRACT_VIEW_ROLES);
  const categories = Object.keys(PROJECT_DOCUMENT_CATEGORIES).filter(
    (category) => seesContract || !CONTRACT_DOCUMENT_CATEGORIES.includes(category),
  );
  const documents = await listAttachments("project", project.id, {
    exclude: seesContract ? [] : CONTRACT_DOCUMENT_CATEGORIES,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumen</CardTitle>
        <CardDescription>
          {seesContract
            ? "Kontrak, addendum, BAP, BAST, gambar, izin, dan korespondensi proyek."
            : "BAP, BAST, gambar, izin, dan korespondensi proyek."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AttachmentList
          entityType="project"
          entityId={project.id}
          attachments={documents.rows}
          categories={categories}
          canManage={hasAnyRole(profile.role, PROJECT_DOCUMENT_MANAGE_ROLES)}
        />
      </CardContent>
    </Card>
  );
}
