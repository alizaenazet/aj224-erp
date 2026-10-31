import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { AddendaCard } from "@/components/projects/addenda-card";
import { ContractCard } from "@/components/projects/contract-card";
import { TermsCard } from "@/components/projects/terms-card";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import {
  CONTRACT_VIEW_ROLES,
  PROJECT_MANAGE_ROLES,
  PROJECT_VIEW_ROLES,
  TERM_READY_ROLES,
} from "@/lib/projects/labels";
import { getProject, projectAddenda, projectTerms } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Kontrak & Termin" };

type Params = Promise<{ id: string }>;

export default function ProjectContractPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectContract params={params} />
    </Suspense>
  );
}

/** Kontrak & Termin tab (PRJ-02, PRJ-03). */
async function ProjectContract({ params }: { params: Params }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, CONTRACT_VIEW_ROLES)) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const [addenda, terms] = await Promise.all([projectAddenda(project.id), projectTerms(project.id)]);
  const canManage = hasAnyRole(profile.role, PROJECT_MANAGE_ROLES);

  return (
    <div className="flex flex-col gap-4">
      <ContractCard project={project} canManage={canManage} />
      <AddendaCard projectId={project.id} addenda={addenda} canManage={canManage} />
      <TermsCard
        projectId={project.id}
        terms={terms}
        contractValue={project.contract_value}
        canManage={canManage}
        canMarkReady={hasAnyRole(profile.role, TERM_READY_ROLES)}
      />
    </div>
  );
}
