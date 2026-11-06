import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { CancelTransactionButton } from "@/components/materials/transaction-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/format";
import { MATERIAL_VIEW_ROLES, TXN_KIND_LABELS, TXN_SOURCE_LABELS, formatQuantity } from "@/lib/materials/labels";
import { getTransaction, transactionLines } from "@/lib/materials/queries";
import { peopleNames } from "@/lib/people";

export const metadata: Metadata = { title: "Transaksi Material" };

type Params = Promise<{ id: string }>;

export default function MaterialTransactionPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <TransactionContent params={params} />
    </Suspense>
  );
}

async function TransactionContent({ params }: { params: Params }) {
  const profile = await requireRole(MATERIAL_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  // RLS hides other projects' transactions from Lapangan, so they are not found.
  const txn = await getTransaction((await params).id);
  if (!txn) notFound();

  const [lines, documents, names] = await Promise.all([
    transactionLines(txn.id),
    listAttachments("material_transaction", txn.id),
    peopleNames(),
  ]);
  const active = txn.status === "active";
  const canCancel = profile.role === "operations" && active && txn.kind !== "opname";
  const canAttach = active && (profile.role === "operations" || profile.role === "field");
  const opname = txn.kind === "opname";

  const info: [string, string][] = [
    ["Tanggal", formatDate(txn.txn_date)],
    ["Lokasi", txn.location_name],
    ...(txn.source ? ([["Sumber", `${TXN_SOURCE_LABELS[txn.source]}${txn.supplier_name ? ` · ${txn.supplier_name}` : ""}`]] as [string, string][]) : []),
    ["No. dokumen", txn.doc_no ?? "—"],
    ...(txn.section_code ? ([["Seksi", txn.section_code]] as [string, string][]) : []),
    [opname ? "Alasan" : "Keterangan", txn.notes ?? "—"],
    ["Dicatat", `${formatDateTime(txn.created_at)} · ${txn.created_by ? (names.get(txn.created_by) ?? "—") : "Sistem"}`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={TXN_KIND_LABELS[txn.kind]}
        description={`${txn.location_name} · ${formatDate(txn.txn_date)}`}
        actions={canCancel ? <CancelTransactionButton id={txn.id} /> : null}
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{TXN_KIND_LABELS[txn.kind]}</Badge>
        {active ? null : <Badge variant="destructive">Batal</Badge>}
      </div>
      {active ? null : (
        <Alert>
          <AlertTitle>Transaksi dibatalkan</AlertTitle>
          <AlertDescription>{txn.cancel_reason}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Data transaksi</CardTitle>
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
          <CardTitle>Material</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                {opname ? <TableHead className="text-right">Sistem</TableHead> : null}
                <TableHead className="text-right">{opname ? "Hitung fisik" : "Jumlah"}</TableHead>
                {opname ? <TableHead className="text-right">Selisih</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const diff = opname && line.system_quantity !== null ? line.quantity - line.system_quantity : null;
                return (
                  <TableRow key={line.id}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <span className="font-medium">{line.material_code}</span>
                      <div className="text-xs text-muted-foreground">{line.material_name}</div>
                    </TableCell>
                    {opname ? (
                      <TableCell className="text-right tabular-nums">
                        {formatQuantity(line.system_quantity)} {line.unit_code}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-right tabular-nums">
                      {formatQuantity(line.quantity)} {line.unit_code}
                    </TableCell>
                    {opname ? (
                      <TableCell className="text-right tabular-nums">
                        {diff ? `${diff > 0 ? "+" : ""}${formatQuantity(diff)}` : "—"}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {canAttach || documents.rows.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Foto dokumen</CardTitle>
            <CardDescription>Nota supplier, surat jalan atau BA serah terima klien.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttachmentList
              entityType="material_transaction"
              entityId={txn.id}
              attachments={documents.rows}
              categories={["document"]}
              canManage={canAttach}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
