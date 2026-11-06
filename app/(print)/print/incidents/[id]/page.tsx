import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { Letterhead } from "@/components/print/letterhead";
import { PrintPage } from "@/components/print/print-page";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { signedImageUrls } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/format";
import { CLASSIFICATION_LABELS, INCIDENT_STATUS_LABELS, INVOLVEMENT_LABELS, K3_VIEW_ROLES, ROOT_CAUSE_LABELS } from "@/lib/k3/labels";
import { getIncident, incidentActions, incidentPeople } from "@/lib/k3/queries";

export const metadata: Metadata = { title: "Cetak Laporan Insiden" };

type Params = Promise<{ id: string }>;

export default function PrintIncidentPage({ params }: { params: Params }) {
  return (
    <>
      <PrintToolbar />
      <Suspense fallback={<ContentSkeleton />}>
        <PrintIncident params={params} />
      </Suspense>
    </>
  );
}

/** Laporan insiden A4 (UMM-05): details on page one, photos on attachment pages. */
async function PrintIncident({ params }: { params: Params }) {
  const profile = await requireRole(K3_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const incident = await getIncident((await params).id);
  if (!incident) notFound();
  const [people, actions, photos] = await Promise.all([
    incidentPeople(incident.id),
    incidentActions(incident.id),
    signedImageUrls("incident", incident.id, "photo"),
  ]);

  const header: [string, string][] = [
    ["Nomor", incident.number],
    ["Status", INCIDENT_STATUS_LABELS[incident.status]],
    ["Proyek", `${incident.project_code} — ${incident.project_name}`],
    ["Waktu", formatDateTime(incident.occurred_at)],
    ["Seksi / tower", [incident.section_code, incident.location_note].filter(Boolean).join(" · ") || "—"],
    ["Klasifikasi", CLASSIFICATION_LABELS[incident.classification]],
  ];
  const text: [string, string | null][] = [
    ["Kronologi", incident.chronology],
    ["Bagian tubuh terdampak", incident.body_parts],
    ["Saksi", incident.witnesses],
    ["Tindakan segera", incident.immediate_action],
    ["Penyebab langsung", incident.direct_cause],
    ["Akar masalah", incident.root_cause ? `${ROOT_CAUSE_LABELS[incident.root_cause]} · hari kerja hilang ${incident.lost_days}` : null],
  ];

  return (
    <>
      <PrintPage>
        <Letterhead />
        <h1 className="text-center text-lg font-semibold">LAPORAN INSIDEN K3</h1>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {header.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <dl className="flex flex-col gap-2 text-sm">
          {text.map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <dt className="font-medium">{label}</dt>
              <dd className="whitespace-pre-line">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
        {people.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orang terlibat</TableHead>
                <TableHead>Keterlibatan</TableHead>
                <TableHead>Cedera</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="whitespace-normal">{person.employee_name ?? `${person.external_name} (pihak luar)`}</TableCell>
                  <TableCell>{INVOLVEMENT_LABELS[person.involvement]}</TableCell>
                  <TableCell className="whitespace-normal">{person.injury ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        {actions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tindakan perbaikan</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Tenggat</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="whitespace-normal">{action.description}</TableCell>
                  <TableCell className="whitespace-normal">{action.pic_name}</TableCell>
                  <TableCell>{formatDate(action.due_date)}</TableCell>
                  <TableCell>{action.status === "done" ? "Selesai" : "Terbuka"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        <div className="grid grid-cols-2 gap-6 pt-8 text-center text-sm">
          {["Pelapor", "Safety Officer / Operasional"].map((role) => (
            <div key={role} className="flex flex-col gap-16">
              <span>{role},</span>
              <span>(________________)</span>
            </div>
          ))}
        </div>
      </PrintPage>
      {photos.length ? (
        <div className="print:break-before-page">
          <PrintPage>
            <h2 className="text-base font-semibold">Lampiran foto — {incident.number}</h2>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, index) =>
                photo.url ? (
                  <figure key={index} className="flex flex-col gap-1 break-inside-avoid">
                    {/* Signed URL from private storage; plain img prints reliably. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`Foto ${index + 1} ${photo.file_name}`} className="w-full rounded-md border" />
                    <figcaption className="text-xs text-muted-foreground">
                      Foto {index + 1} · {formatDateTime(photo.created_at)}
                    </figcaption>
                  </figure>
                ) : null,
              )}
            </div>
          </PrintPage>
        </div>
      ) : null}
    </>
  );
}
