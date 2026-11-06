import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { requireRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { INVOICE_MANAGE_ROLES } from "@/lib/invoices/labels";
import { invoiceFormOptions } from "@/lib/invoices/queries";
import { parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Buat Invoice" };

type SearchParams = Promise<RawSearchParams>;

export default function NewInvoicePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Buat Invoice" />
      <Suspense fallback={<ContentSkeleton />}>
        <NewInvoiceContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** ?term=<id> bills a Siap Ditagih termin; otherwise a non-termin invoice (FIN-01, FIN-02). */
async function NewInvoiceContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(INVOICE_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const [raw, options] = await Promise.all([searchParams, invoiceFormOptions()]);
  const termId = parseText(raw.term);
  const term = termId ? options.terms.find((option) => option.value === termId) : null;
  if (termId && !term) {
    return <p className="text-sm text-muted-foreground">Termin tidak ditemukan atau belum berstatus Siap Ditagih.</p>;
  }
  const project = term ? options.projects.find((option) => option.value === term.project_id) : null;
  return (
    <InvoiceForm
      kind={term ? "term" : "other"}
      term={term ? { id: term.value, label: term.label, projectLabel: project?.label ?? "", amount: term.amount } : null}
      defaults={{ project_id: term?.project_id ?? parseText(raw.project) }}
      projects={options.projects}
      ppnByProject={options.ppnByProject}
      today={todayWib()}
    />
  );
}
