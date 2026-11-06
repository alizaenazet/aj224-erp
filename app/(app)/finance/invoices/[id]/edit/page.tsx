import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { requireRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { INVOICE_MANAGE_ROLES } from "@/lib/invoices/labels";
import { getInvoice, invoiceFormOptions } from "@/lib/invoices/queries";

export const metadata: Metadata = { title: "Ubah Invoice" };

type Params = Promise<{ id: string }>;

export default function EditInvoicePage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader title="Ubah Draft Invoice" />
      <Suspense fallback={<ContentSkeleton />}>
        <EditInvoiceContent params={params} />
      </Suspense>
    </>
  );
}

async function EditInvoiceContent({ params }: { params: Params }) {
  const profile = await requireRole(INVOICE_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const [invoice, options] = await Promise.all([getInvoice((await params).id), invoiceFormOptions()]);
  if (!invoice) notFound();
  if (invoice.status !== "draft" || invoice.kind === "opening") {
    return <p className="text-sm text-muted-foreground">Hanya invoice Draft yang dapat diubah.</p>;
  }
  return (
    <InvoiceForm
      invoiceId={invoice.id}
      kind={invoice.kind}
      term={invoice.term_id ? { id: invoice.term_id, label: invoice.term_name ?? "Termin", projectLabel: `${invoice.project_code} — ${invoice.project_name}`, amount: invoice.gross_amount } : null}
      defaults={{
        project_id: invoice.project_id,
        description: invoice.description,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        gross_amount: invoice.gross_amount,
        dp_deduction: invoice.dp_deduction,
        retention_deduction: invoice.retention_deduction,
        other_deduction: invoice.other_deduction,
        other_deduction_note: invoice.other_deduction_note,
        notes: invoice.notes,
      }}
      projects={options.projects}
      ppnByProject={options.ppnByProject}
      today={todayWib()}
    />
  );
}
