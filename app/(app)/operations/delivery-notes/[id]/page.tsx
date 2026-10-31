import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { ConditionBadge, NoteStatusBadge } from "@/components/equipment/badges";
import { NoteActions } from "@/components/equipment/note-actions";
import { ReceiptForm } from "@/components/equipment/receipt-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { EQUIPMENT_VIEW_ROLES } from "@/lib/equipment/labels";
import { getNote, noteLines, userLocationIds } from "@/lib/equipment/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { peopleNames } from "@/lib/people";

export const metadata: Metadata = { title: "Surat Jalan" };

type Params = Promise<{ id: string }>;

export default function DeliveryNotePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <DeliveryNoteContent params={params} />
    </Suspense>
  );
}

/** One delivery note with receipt (ALT-03, ALT-04). */
async function DeliveryNoteContent({ params }: { params: Params }) {
  const profile = await requireRole(EQUIPMENT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const note = await getNote((await params).id);
  if (!note) notFound();

  const [lines, photos, names, myLocations] = await Promise.all([
    noteLines(note.id),
    listAttachments("delivery_note", note.id),
    peopleNames(),
    profile.role === "field" ? userLocationIds() : Promise.resolve(new Set<string>()),
  ]);
  const canReceive =
    note.status === "sent" && (profile.role === "operations" || (profile.role === "field" && myLocations.has(note.to_location_id)));
  const received = note.status === "received";

  const info: [string, string][] = [
    ["Tanggal", formatDate(note.note_date)],
    ["Asal", note.from_location],
    ["Tujuan", note.to_location],
    ["Kendaraan", note.vehicle ?? "—"],
    ["Sopir", note.driver ?? "—"],
    ["Catatan", note.notes ?? "—"],
    ["Dikirim", note.sent_at ? `${formatDateTime(note.sent_at)} · ${note.sent_by ? (names.get(note.sent_by) ?? "—") : "—"}` : "—"],
    [
      "Diterima",
      note.received_at ? `${formatDateTime(note.received_at)} · ${note.received_by ? (names.get(note.received_by) ?? "—") : "—"}` : "—",
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={note.number}
        description={`${note.from_location} → ${note.to_location}`}
        actions={<NoteActions noteId={note.id} canCancel={profile.role === "operations" && note.status === "sent"} />}
      />
      <div className="flex flex-wrap gap-2">
        <NoteStatusBadge status={note.status} />
      </div>
      {note.status === "cancelled" ? (
        <Alert>
          <AlertTitle>Surat jalan dibatalkan</AlertTitle>
          <AlertDescription>{note.cancel_reason}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Data surat jalan</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {info.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar alat</CardTitle>
          {received && note.receipt_note ? <CardDescription>{note.receipt_note}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alat</TableHead>
                <TableHead>Kondisi kirim</TableHead>
                <TableHead className="text-right">Dikirim</TableHead>
                {received ? (
                  <>
                    <TableHead className="text-right">Baik</TableHead>
                    <TableHead className="text-right">Rusak</TableHead>
                    <TableHead className="text-right">Hilang</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="max-w-72 whitespace-normal">
                    <span className="font-medium">{line.tool_code}</span>
                    <div className="text-xs text-muted-foreground">{line.tool_name}</div>
                  </TableCell>
                  <TableCell>
                    <ConditionBadge condition={line.condition} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  {received ? (
                    <>
                      <TableCell className="text-right tabular-nums">{line.received_good}</TableCell>
                      <TableCell className="text-right tabular-nums">{line.received_damaged || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{line.missing || "—"}</TableCell>
                      <TableCell className="max-w-64 whitespace-normal">{line.receipt_note ?? "—"}</TableCell>
                    </>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canReceive || photos.rows.length ? (
        <Card id="foto">
          <CardHeader>
            <CardTitle>Foto penerimaan</CardTitle>
            <CardDescription>Wajib minimal satu foto bila ada alat rusak atau kurang.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttachmentList
              entityType="delivery_note"
              entityId={note.id}
              attachments={photos.rows}
              categories={["receipt"]}
              canManage={canReceive}
            />
          </CardContent>
        </Card>
      ) : null}

      {canReceive ? <ReceiptForm noteId={note.id} lines={lines} hasPhoto={photos.rows.length > 0} /> : null}
    </div>
  );
}
