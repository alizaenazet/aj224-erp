import type { Metadata } from "next";
import { PencilIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { CancelPaymentButton, InvoiceStatusActions, PaymentDialogButton } from "@/components/invoices/invoice-actions";
import { InvoiceStatusBadge } from "@/components/invoices/invoices-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { formatDate, formatNumber, formatRupiah, todayWib } from "@/lib/format";
import { INVOICE_KIND_LABELS, INVOICE_VIEW_ROLES } from "@/lib/invoices/labels";
import { getInvoice, invoiceFormOptions, invoicePayments } from "@/lib/invoices/queries";

export const metadata: Metadata = { title: "Invoice" };

type Params = Promise<{ id: string }>;

export default function InvoicePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <InvoiceContent params={params} />
    </Suspense>
  );
}

/** One invoice: amounts, payments, BAP and proofs (FIN-01 … FIN-04). */
async function InvoiceContent({ params }: { params: Params }) {
  const profile = await requireRole(INVOICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const invoice = await getInvoice((await params).id);
  if (!invoice) notFound();

  const manage = profile.role === "finance";
  const [payments, documents, options] = await Promise.all([
    invoicePayments(invoice.id),
    listAttachments("invoice", invoice.id),
    manage ? invoiceFormOptions() : Promise.resolve(null),
  ]);
  const proofs = Object.fromEntries(
    await Promise.all(payments.map(async (payment) => [payment.id, (await listAttachments("invoice_payment", payment.id)).rows] as const)),
  );
  const open = invoice.status === "issued" || invoice.status === "partial";
  const activePayments = payments.some((payment) => payment.status === "active");

  const amounts: [string, number, boolean?][] = [
    ["Nilai bruto", invoice.gross_amount],
    ["Pengembalian uang muka", -invoice.dp_deduction],
    ["Retensi", -invoice.retention_deduction],
    [`Potongan lain${invoice.other_deduction_note ? ` (${invoice.other_deduction_note})` : ""}`, -invoice.other_deduction],
    ["DPP", invoice.dpp, true],
    [`PPN ${formatNumber(invoice.ppn_rate, 2)}%`, invoice.ppn_amount],
    ["Total", invoice.total, true],
    ["Diterima", invoice.received],
    ["PPh dipotong klien", invoice.pph],
    ["Sisa tagihan", invoice.balance, true],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice.number ?? "Draft invoice"}
        description={`${invoice.project_code} · ${invoice.client_name ?? "—"} · ${invoice.term_name ?? invoice.description}`}
        actions={
          <>
            {invoice.status !== "draft" ? (
              <Button asChild variant="outline">
                <Link href={`/print/invoices/${invoice.id}`} target="_blank">
                  <PrinterIcon />
                  Cetak
                </Link>
              </Button>
            ) : null}
            {manage && invoice.status === "draft" && invoice.kind !== "opening" ? (
              <Button asChild variant="outline">
                <Link href={`/finance/invoices/${invoice.id}/edit`}>
                  <PencilIcon />
                  Ubah
                </Link>
              </Button>
            ) : null}
            {manage ? (
              <InvoiceStatusActions
                id={invoice.id}
                canIssue={invoice.status === "draft"}
                canCancel={invoice.status !== "cancelled" && !activePayments}
              />
            ) : null}
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        <InvoiceStatusBadge status={invoice.status} />
        <Badge variant="outline">{INVOICE_KIND_LABELS[invoice.kind]}</Badge>
        {invoice.days_overdue > 0 ? <Badge variant="destructive">{invoice.days_overdue} hari lewat jatuh tempo</Badge> : null}
      </div>
      {invoice.status === "cancelled" ? (
        <Alert>
          <AlertTitle>Invoice dibatalkan</AlertTitle>
          <AlertDescription>{invoice.cancel_reason}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rincian</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              {amounts
                .filter(([, value], index) => value !== 0 || index === 0 || index >= 4)
                .map(([label, value, strong]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4">
                    <dt className={strong ? "font-medium" : "text-muted-foreground"}>{label}</dt>
                    <dd className={strong ? "font-medium tabular-nums" : "tabular-nums"}>{formatRupiah(value)}</dd>
                  </div>
                ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              {[
                ["Tanggal", formatDate(invoice.invoice_date)],
                ["Jatuh tempo", formatDate(invoice.due_date)],
                ["Proyek", `${invoice.project_code} — ${invoice.project_name}`],
                ["Uraian", invoice.description],
                ["Catatan", invoice.notes ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="whitespace-pre-line">{value}</dd>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Termin proyek</dt>
                <dd>
                  <Link href={`/projects/${invoice.project_id}/contract`} className="underline-offset-4 hover:underline">
                    Kontrak & Termin
                  </Link>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran masuk</CardTitle>
          <CardDescription>Lunas bila diterima + potongan PPh = total invoice.</CardDescription>
          {manage && open && options ? (
            <CardAction>
              <PaymentDialogButton invoiceId={invoice.id} balance={invoice.balance} banks={options.banks} today={todayWib()} />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {payments.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Diterima</TableHead>
                  <TableHead className="text-right">PPh</TableHead>
                  <TableHead>Rekening / bukti potong</TableHead>
                  <TableHead>Bukti transfer</TableHead>
                  {manage ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(payment.payment_date)}
                      {payment.status === "cancelled" ? <Badge variant="destructive" className="ml-2">Batal</Badge> : null}
                      {payment.is_opening ? <div className="text-xs text-muted-foreground">Saldo awal</div> : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(payment.amount_received)}</TableCell>
                    <TableCell className="text-right tabular-nums">{payment.pph_amount ? formatRupiah(payment.pph_amount) : "—"}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal">
                      {payment.bank_label ?? "—"}
                      {payment.pph_slip_no ? <div className="text-xs text-muted-foreground">Bukti potong {payment.pph_slip_no}</div> : null}
                      {payment.notes ? <div className="text-xs text-muted-foreground">{payment.notes}</div> : null}
                      {payment.cancel_reason ? <div className="text-xs text-muted-foreground">Batal: {payment.cancel_reason}</div> : null}
                    </TableCell>
                    <TableCell className="min-w-56">
                      <AttachmentList
                        entityType="invoice_payment"
                        entityId={payment.id}
                        attachments={proofs[payment.id] ?? []}
                        categories={["proof"]}
                        canManage={manage && payment.status === "active"}
                      />
                    </TableCell>
                    {manage ? (
                      <TableCell className="text-right">{payment.status === "active" ? <CancelPaymentButton id={payment.id} /> : null}</TableCell>
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
          <CardDescription>BAP dan dokumen pendukung penagihan.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttachmentList
            entityType="invoice"
            entityId={invoice.id}
            attachments={documents.rows}
            categories={["bap", "other"]}
            canManage={manage && invoice.status !== "cancelled"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
