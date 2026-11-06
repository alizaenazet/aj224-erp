import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { Letterhead } from "@/components/print/letterhead";
import { PrintPage } from "@/components/print/print-page";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { CONDITION_LABELS, EQUIPMENT_VIEW_ROLES } from "@/lib/equipment/labels";
import { getNote, noteLines, noteMaterialLines } from "@/lib/equipment/queries";
import { formatQuantity } from "@/lib/materials/labels";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Cetak Surat Jalan" };

type Params = Promise<{ id: string }>;

export default function PrintDeliveryNotePage({ params }: { params: Params }) {
  return (
    <>
      <PrintToolbar />
      <Suspense fallback={<ContentSkeleton />}>
        <PrintDeliveryNote params={params} />
      </Suspense>
    </>
  );
}

/** Surat jalan A4 (ALT-03, UMM-05) with signature boxes for sender, driver and receiver. */
async function PrintDeliveryNote({ params }: { params: Params }) {
  const profile = await requireRole(EQUIPMENT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const note = await getNote((await params).id);
  if (!note) notFound();
  const [lines, materialLines] = await Promise.all([noteLines(note.id), noteMaterialLines(note.id)]);

  const header: [string, string][] = [
    ["Nomor", note.number],
    ["Tanggal", formatDate(note.note_date)],
    ["Dari", note.from_location],
    ["Ke", note.to_location],
    ["Kendaraan", note.vehicle ?? "—"],
    ["Sopir", note.driver ?? "—"],
  ];

  return (
    <PrintPage>
      <Letterhead />
      <h1 className="text-center text-lg font-semibold">SURAT JALAN</h1>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {header.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {lines.length ? (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No.</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Nama alat</TableHead>
            <TableHead>Kondisi</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, index) => (
            <TableRow key={line.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{line.tool_code}</TableCell>
              <TableCell className="whitespace-normal">{line.tool_name}</TableCell>
              <TableCell>{CONDITION_LABELS[line.condition]}</TableCell>
              <TableCell className="text-right">{line.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      ) : null}
      {materialLines.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Nama material</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Satuan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materialLines.map((line, index) => (
              <TableRow key={line.id}>
                <TableCell>{lines.length + index + 1}</TableCell>
                <TableCell>{line.material_code}</TableCell>
                <TableCell className="whitespace-normal">{line.material_name}</TableCell>
                <TableCell className="text-right">{formatQuantity(line.quantity)}</TableCell>
                <TableCell>{line.unit_code}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      {note.notes ? <p className="text-sm">Catatan: {note.notes}</p> : null}
      <div className="grid grid-cols-3 gap-6 pt-8 text-center text-sm">
        {["Pengirim", "Sopir", "Penerima"].map((role) => (
          <div key={role} className="flex flex-col gap-16">
            <span>{role},</span>
            <span>(________________)</span>
          </div>
        ))}
      </div>
    </PrintPage>
  );
}
