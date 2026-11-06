import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { BillForm } from "@/components/bills/bill-form";
import { requireRole } from "@/lib/auth/session";
import { FINANCE_MANAGE_ROLES } from "@/lib/bills/labels";
import { billLines, costFormOptions, getBill } from "@/lib/bills/queries";
import { todayWib } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah Tagihan Supplier" };

type Params = Promise<{ id: string }>;

export default function EditBillPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader title="Ubah Tagihan Supplier" />
      <Suspense fallback={<ContentSkeleton />}>
        <EditBillContent params={params} />
      </Suspense>
    </>
  );
}

async function EditBillContent({ params }: { params: Params }) {
  const profile = await requireRole(FINANCE_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const bill = await getBill((await params).id);
  if (!bill) notFound();
  if (bill.paid > 0 || bill.status === "cancelled" || bill.is_opening) {
    return <p className="text-sm text-muted-foreground">Tagihan yang sudah dibayar, batal, atau saldo awal tidak dapat diubah.</p>;
  }
  const [lines, options] = await Promise.all([billLines(bill.id), costFormOptions()]);
  return (
    <BillForm
      billId={bill.id}
      defaults={{
        supplier_id: bill.supplier_id,
        bill_no: bill.bill_no,
        bill_date: bill.bill_date,
        due_date: bill.due_date,
        ppn_amount: bill.ppn_amount,
        delivery_note_id: bill.delivery_note_id,
        notes: bill.notes,
        lines: lines.map((line) => ({
          description: line.description,
          amount: line.amount,
          project_id: line.project_id,
          cost_category_id: line.cost_category_id,
        })),
      }}
      suppliers={options.suppliers}
      projects={options.projects}
      categories={options.categories}
      deliveryNotes={options.deliveryNotes}
      today={todayWib()}
    />
  );
}
