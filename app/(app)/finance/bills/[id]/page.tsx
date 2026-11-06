import type { Metadata } from "next";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { BillPaymentButton, CancelBillButton, CancelBillPaymentButton } from "@/components/bills/bill-actions";
import { BillStatusBadge } from "@/components/bills/bills-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { METHOD_LABELS, PAYABLE_VIEW_ROLES } from "@/lib/bills/labels";
import { billLines, billPayments, costFormOptions, getBill } from "@/lib/bills/queries";
import { formatDate, formatRupiah, todayWib } from "@/lib/format";

export const metadata: Metadata = { title: "Tagihan Supplier" };

type Params = Promise<{ id: string }>;

export default function BillPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <BillContent params={params} />
    </Suspense>
  );
}

async function BillContent({ params }: { params: Params }) {
  const profile = await requireRole(PAYABLE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const bill = await getBill((await params).id);
  if (!bill) notFound();
  const manage = profile.role === "finance";
  const [lines, payments, files, options] = await Promise.all([
    billLines(bill.id),
    billPayments(bill.id),
    listAttachments("supplier_bill", bill.id),
    manage ? costFormOptions() : Promise.resolve(null),
  ]);
  const proofs = Object.fromEntries(
    await Promise.all(payments.map(async (payment) => [payment.id, (await listAttachments("supplier_payment", payment.id)).rows] as const)),
  );
  const open = bill.status === "unpaid" || bill.status === "partial";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${bill.supplier_name} · ${bill.bill_no}`}
        description={`Tanggal ${formatDate(bill.bill_date)} · jatuh tempo ${formatDate(bill.due_date)}`}
        actions={
          manage ? (
            <>
              {bill.paid === 0 && bill.status !== "cancelled" && !bill.is_opening ? (
                <Button asChild variant="outline">
                  <Link href={`/finance/bills/${bill.id}/edit`}>
                    <PencilIcon />
                    Ubah
                  </Link>
                </Button>
              ) : null}
              {bill.paid === 0 && bill.status !== "cancelled" ? <CancelBillButton id={bill.id} /> : null}
            </>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2">
        <BillStatusBadge status={bill.status} />
        {bill.is_opening ? <Badge variant="outline">Saldo awal</Badge> : null}
        {bill.days_overdue > 0 ? <Badge variant="destructive">{bill.days_overdue} hari terlambat</Badge> : null}
        {bill.delivery_note_id ? (
          <Badge variant="outline">
            <Link href={`/operations/delivery-notes/${bill.delivery_note_id}`}>Surat jalan {bill.delivery_note_number}</Link>
          </Badge>
        ) : null}
      </div>
      {bill.status === "cancelled" ? (
        <Alert>
          <AlertTitle>Tagihan dibatalkan</AlertTitle>
          <AlertDescription>{bill.cancel_reason}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Rincian biaya</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uraian</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="max-w-80 whitespace-normal">{line.description}</TableCell>
                  <TableCell className="whitespace-nowrap">{line.project_code ?? "Kantor/Umum"}</TableCell>
                  <TableCell className="whitespace-normal">{line.category_name}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(line.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              {[
                ["Subtotal", bill.subtotal],
                ["PPN", bill.ppn_amount],
                ["Total", bill.total],
                ["Dibayar", bill.paid],
                ["Sisa", bill.balance],
              ].map(([label, value]) => (
                <TableRow key={String(label)}>
                  <TableCell colSpan={3}>{label}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(value as number)}</TableCell>
                </TableRow>
              ))}
            </TableFooter>
          </Table>
          {bill.notes ? <p className="pt-4 text-sm text-muted-foreground">{bill.notes}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran</CardTitle>
          {manage && open && options ? (
            <CardAction>
              <BillPaymentButton billId={bill.id} balance={bill.balance} banks={options.banks} today={todayWib()} />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {payments.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Bukti</TableHead>
                  {manage ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(payment.payment_date)}
                      {payment.status === "cancelled" ? <Badge variant="destructive" className="ml-2">Batal</Badge> : null}
                      {payment.notes ? <div className="text-xs text-muted-foreground">{payment.notes}</div> : null}
                    </TableCell>
                    <TableCell>{METHOD_LABELS[payment.method] ?? payment.method}{payment.bank_label ? ` · ${payment.bank_label}` : ""}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(payment.amount)}</TableCell>
                    <TableCell className="min-w-56">
                      <AttachmentList
                        entityType="supplier_payment"
                        entityId={payment.id}
                        attachments={proofs[payment.id] ?? []}
                        categories={["proof"]}
                        canManage={manage && payment.status === "active"}
                      />
                    </TableCell>
                    {manage ? (
                      <TableCell className="text-right">{payment.status === "active" ? <CancelBillPaymentButton id={payment.id} /> : null}</TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lampiran</CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentList
            entityType="supplier_bill"
            entityId={bill.id}
            attachments={files.rows}
            categories={["invoice", "other"]}
            canManage={manage && bill.status !== "cancelled"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
