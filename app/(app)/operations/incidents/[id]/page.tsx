import type { Metadata } from "next";
import { PencilIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { ClassificationBadge, IncidentStatusBadge } from "@/components/k3/badges";
import { ActionsCard, IncidentStatusActions, InvestigationCard } from "@/components/k3/investigation-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { CLASSIFICATION_LABELS, INVOLVEMENT_LABELS, K3_VIEW_ROLES } from "@/lib/k3/labels";
import { getIncident, incidentActions, incidentFormOptions, incidentPeople } from "@/lib/k3/queries";
import { peopleNames } from "@/lib/people";

export const metadata: Metadata = { title: "Insiden K3" };

type Params = Promise<{ id: string }>;

export default function IncidentPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <IncidentContent params={params} />
    </Suspense>
  );
}

/** One incident: details, people, photos, investigation and actions (K3-01 … K3-04). */
async function IncidentContent({ params }: { params: Params }) {
  const profile = await requireRole(K3_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  // RLS hides other projects' incidents from Lapangan.
  const incident = await getIncident((await params).id);
  if (!incident) notFound();

  const manage = profile.role === "operations";
  const open = incident.status === "reported" || incident.status === "investigating";
  const [people, actions, photos, names, options] = await Promise.all([
    incidentPeople(incident.id),
    incidentActions(incident.id),
    listAttachments("incident", incident.id),
    peopleNames(),
    manage ? incidentFormOptions(profile.role) : Promise.resolve(null),
  ]);
  const evidence = Object.fromEntries(
    await Promise.all(
      actions.map(async (action) => {
        const files = await listAttachments("incident_action", action.id);
        return [
          action.id,
          files.rows.length || (manage && open) ? (
            <div className="pt-2">
              <AttachmentList
                entityType="incident_action"
                entityId={action.id}
                attachments={files.rows}
                categories={["evidence"]}
                canManage={manage && open}
              />
            </div>
          ) : null,
        ] as const;
      }),
    ),
  );

  const info: [string, string][] = [
    ["Waktu kejadian", formatDateTime(incident.occurred_at)],
    ["Proyek", `${incident.project_code} — ${incident.project_name}`],
    ["Seksi / tower", [incident.section_code, incident.location_note].filter(Boolean).join(" · ") || "—"],
    ["Klasifikasi", CLASSIFICATION_LABELS[incident.classification]],
    ["Kronologi", incident.chronology],
    ["Bagian tubuh terdampak", incident.body_parts ?? "—"],
    ["Saksi", incident.witnesses ?? "—"],
    ["Tindakan segera", incident.immediate_action ?? "—"],
    ["Dilaporkan", `${formatDateTime(incident.created_at)} · ${incident.reported_by ? (names.get(incident.reported_by) ?? "—") : "—"}`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={incident.number}
        description={`${incident.project_code} · ${formatDateTime(incident.occurred_at)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/print/incidents/${incident.id}`} target="_blank">
                <PrinterIcon />
                Cetak
              </Link>
            </Button>
            {manage && open ? (
              <>
                <Button asChild variant="outline">
                  <Link href={`/operations/incidents/${incident.id}/edit`}>
                    <PencilIcon />
                    Ubah
                  </Link>
                </Button>
                <IncidentStatusActions incidentId={incident.id} canClose={incident.status === "investigating"} />
              </>
            ) : null}
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        <ClassificationBadge classification={incident.classification} />
        <IncidentStatusBadge status={incident.status} />
      </div>
      {incident.status === "cancelled" ? (
        <Alert>
          <AlertTitle>Insiden dibatalkan</AlertTitle>
          <AlertDescription>{incident.cancel_reason}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Data kejadian</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {info.map(([label, value]) => (
              <div key={label} className={label === "Kronologi" ? "flex flex-col gap-1 sm:col-span-2" : "flex flex-col gap-1"}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orang terlibat / korban</CardTitle>
        </CardHeader>
        <CardContent>
          {people.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Keterlibatan</TableHead>
                  <TableHead>Cedera</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="whitespace-normal">
                      {person.employee_name ?? `${person.external_name} (pihak luar)`}
                    </TableCell>
                    <TableCell>{INVOLVEMENT_LABELS[person.involvement]}</TableCell>
                    <TableCell className="whitespace-normal">{person.injury ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada korban atau orang terlibat.</p>
          )}
        </CardContent>
      </Card>

      <Card id="foto">
        <CardHeader>
          <CardTitle>Foto</CardTitle>
          <CardDescription>Maksimal 10 foto; dikompres otomatis di perangkat.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttachmentList
            entityType="incident"
            entityId={incident.id}
            attachments={photos.rows}
            categories={["photo"]}
            canManage={open && (profile.role === "operations" || profile.role === "field")}
          />
        </CardContent>
      </Card>

      {profile.role === "field" ? null : (
        <>
          <InvestigationCard
            incidentId={incident.id}
            directCause={incident.direct_cause}
            rootCause={incident.root_cause}
            lostDays={incident.lost_days}
            canEdit={manage && open}
          />
          <ActionsCard
            incidentId={incident.id}
            actions={actions}
            employees={options?.employees ?? []}
            canEdit={manage && open}
            evidence={evidence}
          />
        </>
      )}
    </div>
  );
}
