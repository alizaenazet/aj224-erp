import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { IncidentForm } from "@/components/k3/incident-form";
import { requireRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { K3_REPORT_ROLES } from "@/lib/k3/labels";
import { incidentFormOptions } from "@/lib/k3/queries";
import { parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Lapor Insiden" };

type SearchParams = Promise<RawSearchParams>;

export default function NewIncidentPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Lapor Insiden" description="Insiden LTI dan Fatal langsung dikirim ke Direktur dan Operasional." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewIncidentContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function nowWib() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

async function NewIncidentContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(K3_REPORT_ROLES);
  if (!profile) return <AccessDenied />;
  const [raw, options] = await Promise.all([searchParams, incidentFormOptions(profile.role)]);
  const project = parseText(raw.project);
  return (
    <IncidentForm
      defaults={project && options.projects.some((option) => option.value === project) ? { project_id: project } : undefined}
      projects={options.projects}
      sections={options.sections}
      employees={options.employees}
      today={todayWib()}
      now={nowWib()}
    />
  );
}
