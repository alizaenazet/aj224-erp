import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { CancelExpenseButton } from "@/components/expenses/expenses-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { METHOD_LABELS, PAYABLE_VIEW_ROLES } from "@/lib/bills/labels";
import { getExpense } from "@/lib/bills/queries";
import { formatDate, formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Pengeluaran" };

type Params = Promise<{ id: string }>;

export default function ExpensePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ExpenseContent params={params} />
    </Suspense>
  );
}

async function ExpenseContent({ params }: { params: Params }) {
  const profile = await requireRole(PAYABLE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const expense = await getExpense((await params).id);
  if (!expense) notFound();
  const files = await listAttachments("expense", expense.id);
  const manage = profile.role === "finance" && expense.status === "active";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={expense.description}
        description={`${expense.project_code ?? "Kantor/Umum"} · ${formatDate(expense.expense_date)}`}
        actions={manage ? <CancelExpenseButton id={expense.id} /> : null}
      />
      {expense.status === "cancelled" ? (
        <Alert>
          <AlertTitle>Pengeluaran dibatalkan</AlertTitle>
          <AlertDescription>{expense.cancel_reason}</AlertDescription>
        </Alert>
      ) : null}
      {!expense.no_receipt && !expense.is_opening && !files.rows.length && expense.status === "active" ? (
        <Alert variant="warning">
          <AlertDescription>Foto nota belum dilampirkan.</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Jumlah", formatRupiah(expense.amount)],
              ["Kategori", expense.category_name],
              ["Penerima", expense.payee ?? "—"],
              ["Metode", METHOD_LABELS[expense.method] ?? expense.method],
              ["Tanpa nota", expense.no_receipt ? `Ya — ${expense.no_receipt_note}` : "Tidak"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card id="nota">
        <CardHeader>
          <CardTitle>Foto nota / bukti</CardTitle>
          <CardDescription>Foto dikompres otomatis di perangkat.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttachmentList entityType="expense" entityId={expense.id} attachments={files.rows} categories={["receipt"]} canManage={manage} />
        </CardContent>
      </Card>
    </div>
  );
}
