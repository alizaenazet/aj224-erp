import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { Letterhead } from "@/components/print/letterhead";
import { PrintPage } from "@/components/print/print-page";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { getCompanyProfile, listBankAccounts } from "@/lib/company/queries";
import { formatDate, formatNumber, formatRupiah, terbilang } from "@/lib/format";
import { INVOICE_VIEW_ROLES } from "@/lib/invoices/labels";
import { getInvoice } from "@/lib/invoices/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cetak Invoice" };

type Params = Promise<{ id: string }>;

export default function PrintInvoicePage({ params }: { params: Params }) {
  return (
    <>
      <PrintToolbar />
      <Suspense fallback={<ContentSkeleton />}>
        <PrintInvoice params={params} />
      </Suspense>
    </>
  );
}

/** Invoice A4 (FIN-01, UMM-05) with amount in words and the default bank account. */
async function PrintInvoice({ params }: { params: Params }) {
  const profile = await requireRole(INVOICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const invoice = await getInvoice((await params).id);
  if (!invoice || invoice.status === "draft") notFound();

  const supabase = await createClient();
  const [{ profile: company }, banks, { data: client }, { data: contract }] = await Promise.all([
    getCompanyProfile(),
    listBankAccounts(),
    invoice.client_id
      ? supabase.from("clients").select("name, address, npwp").eq("id", invoice.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("project_contracts").select("contract_no").eq("project_id", invoice.project_id).maybeSingle(),
  ]);
  const bank = banks.find((account) => account.is_default && account.is_active) ?? banks.find((account) => account.is_active);

  const lines: [string, number][] = [
    [
      invoice.term_name && invoice.term_name !== invoice.description ? `${invoice.term_name} — ${invoice.description}` : invoice.description,
      invoice.gross_amount,
    ],
    ...(invoice.dp_deduction ? ([["Dikurangi pengembalian uang muka", -invoice.dp_deduction]] as [string, number][]) : []),
    ...(invoice.retention_deduction ? ([["Dikurangi retensi", -invoice.retention_deduction]] as [string, number][]) : []),
    ...(invoice.other_deduction ? ([[`Dikurangi ${invoice.other_deduction_note ?? "potongan lain"}`, -invoice.other_deduction]] as [string, number][]) : []),
  ];

  return (
    <PrintPage>
      <Letterhead />
      <h1 className="text-center text-lg font-semibold">INVOICE</h1>
      <div className="grid grid-cols-2 gap-6 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Kepada</span>
          <span className="font-medium">{client?.name ?? invoice.client_name ?? "—"}</span>
          {client?.address ? <span className="whitespace-pre-line">{client.address}</span> : null}
          {client?.npwp ? <span>NPWP {client.npwp}</span> : null}
        </div>
        <dl className="flex flex-col gap-1">
          {[
            ["Nomor", invoice.number ?? "—"],
            ["Tanggal", formatDate(invoice.invoice_date)],
            ["Jatuh tempo", formatDate(invoice.due_date)],
            ["Proyek", `${invoice.project_code} — ${invoice.project_name}`],
            ["No. kontrak", contract?.contract_no ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Uraian</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell className="whitespace-normal">{label}</TableCell>
              <TableCell className="text-right whitespace-nowrap">{formatRupiah(value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Dasar Pengenaan Pajak (DPP)</TableCell>
            <TableCell className="text-right whitespace-nowrap">{formatRupiah(invoice.dpp)}</TableCell>
          </TableRow>
          {company?.is_pkp ? (
            <TableRow>
              <TableCell>PPN {formatNumber(invoice.ppn_rate, 2)}%</TableCell>
              <TableCell className="text-right whitespace-nowrap">{formatRupiah(invoice.ppn_amount)}</TableCell>
            </TableRow>
          ) : null}
          <TableRow>
            <TableCell className="font-semibold">Total tagihan</TableCell>
            <TableCell className="text-right font-semibold whitespace-nowrap">{formatRupiah(invoice.total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <p className="text-sm">
        <span className="text-muted-foreground">Terbilang: </span>
        <span className="font-medium capitalize italic">{terbilang(invoice.total)}</span>
      </p>
      {bank ? (
        <p className="text-sm">
          Pembayaran ditransfer ke {bank.bank_name} No. {bank.account_number} a.n. {bank.account_holder}.
        </p>
      ) : null}
      <div className="flex justify-end pt-6 text-center text-sm">
        <div className="flex flex-col gap-16">
          <span>Hormat kami,</span>
          <span>(________________)</span>
        </div>
      </div>
    </PrintPage>
  );
}
