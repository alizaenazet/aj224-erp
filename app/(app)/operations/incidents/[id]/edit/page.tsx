import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { IncidentForm } from "@/components/k3/incident-form";
import { requireRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { K3_MANAGE_ROLES } from "@/lib/k3/labels";
import { getIncident, incidentFormOptions, incidentPeople } from "@/lib/k3/queries";

export const metadata: Metadata = { title: "Ubah Insiden" };

type Params = Promise<{ id: string }>;

export default function EditIncidentPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader title="Ubah Insiden" />
      <Suspense fallback={<ContentSkeleton />}>
        <EditIncidentContent params={params} />
      </Suspense>
    </>
  );
}

async function EditIncidentContent({ params }: { params: Params }) {
  const profile = await requireRole(K3_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const incident = await getIncident((await params).id);
  if (!incident) notFound();
  if (incident.status === "closed" || incident.status === "cancelled") {
    return <p className="text-sm text-muted-foreground">Insiden yang sudah ditutup atau batal tidak dapat diubah.</p>;
  }
  const [people, options] = await Promise.all([incidentPeople(incident.id), incidentFormOptions(profile.role)]);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(incident.occurred_at),
  );
  return (
    <IncidentForm
      incidentId={incident.id}
      defaults={{
        project_id: incident.project_id,
        occurred_date: incident.occurred_on,
        occurred_time: time,
        section_id: incident.section_id,
        location_note: incident.location_note,
        classification: incident.classification,
        chronology: incident.chronology,
        body_parts: incident.body_parts,
        witnesses: incident.witnesses,
        immediate_action: incident.immediate_action,
        people: people.map((person) => ({
          employee_id: person.employee_id,
          external_name: person.external_name,
          involvement: person.involvement,
          injury: person.injury,
        })),
      }}
      projects={options.projects}
      sections={options.sections}
      employees={options.employees}
      today={todayWib()}
      now={time}
    />
  );
}
