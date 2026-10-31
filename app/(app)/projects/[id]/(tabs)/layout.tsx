import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { PageHeader } from "@/components/app/page-header";
import { ProjectActions } from "@/components/projects/project-actions";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectTabs, type ProjectTab } from "@/components/projects/project-tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import {
  BUDGET_VIEW_ROLES,
  CONTRACT_VIEW_ROLES,
  PROJECT_MANAGE_ROLES,
  PROJECT_STATUS_ROLES,
  PROJECT_VIEW_ROLES,
} from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";
import { PROGRESS_VIEW_ROLES } from "@/lib/progress/labels";
import { TEAM_VIEW_ROLES } from "@/lib/attendance/labels";
import { REPORT_VIEW_ROLES } from "@/lib/daily-reports/labels";
import { EQUIPMENT_VIEW_ROLES } from "@/lib/equipment/labels";

type Params = Promise<{ id: string }>;

/** Project page shell: header, status menu and tabs (PRD §9). */
export default function ProjectLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <ProjectHeader params={params} />
      </Suspense>
      {children}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

async function ProjectHeader({ params }: { params: Params }) {
  const profile = await requireRole(PROJECT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const tabs: ProjectTab[] = [
    { segment: "", label: "Ringkasan" },
    ...(hasAnyRole(profile.role, CONTRACT_VIEW_ROLES) ? [{ segment: "contract", label: "Kontrak & Termin" }] : []),
    ...(hasAnyRole(profile.role, BUDGET_VIEW_ROLES) ? [{ segment: "budget", label: "RAB & Biaya" }] : []),
    ...(hasAnyRole(profile.role, PROGRESS_VIEW_ROLES) ? [{ segment: "progress", label: "Seksi & Progres" }] : []),
    ...(hasAnyRole(profile.role, REPORT_VIEW_ROLES) ? [{ segment: "reports", label: "Laporan Harian" }] : []),
    ...(hasAnyRole(profile.role, TEAM_VIEW_ROLES) ? [{ segment: "team", label: "Tim & Absensi" }] : []),
    ...(hasAnyRole(profile.role, EQUIPMENT_VIEW_ROLES) ? [{ segment: "equipment", label: "Alat" }] : []),
    { segment: "documents", label: "Dokumen" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={project.name}
        description={[project.code, project.client_name].filter(Boolean).join(" · ")}
        actions={
          <ProjectActions
            project={project}
            canEdit={hasAnyRole(profile.role, PROJECT_MANAGE_ROLES)}
            canSetStatus={hasAnyRole(profile.role, PROJECT_STATUS_ROLES) && project.status !== "closed"}
            canViewHistory={hasAnyRole(profile.role, ["super_admin", "director"])}
          />
        }
      />
      <div className="flex flex-wrap gap-2">
        <ProjectStatusBadge status={project.status} />
        {project.voltage_kv ? <Badge variant="outline">{project.voltage_kv} kV</Badge> : null}
        {project.tender_id ? <Badge variant="outline">Dari tender</Badge> : null}
      </div>
      <ProjectTabs projectId={project.id} tabs={tabs} />
    </div>
  );
}
