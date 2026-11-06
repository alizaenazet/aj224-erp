import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { LedgerTable } from "@/components/field-cash/ledger-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAttachments } from "@/lib/attachments/queries";
import { requireRole } from "@/lib/auth/session";
import { cancelFieldExpense } from "@/lib/bills/actions";
import { FIELD_CASH_VIEW_ROLES, FIELD_KIND_LABELS, FIELD_STATUS_LABELS, FIELD_STATUS_VARIANTS } from "@/lib/bills/labels";
import { getFieldExpense } from "@/lib/bills/queries";
import { formatDate, formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Pengeluaran Kas Lapangan" };

type Params = Promise<{ id: string }>;

export default function FieldExpensePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <FieldExpense params={params} />
    </Suspense>
  );
}

async function FieldExpense({ params }: { params: Params }) {
  const profile = await requireRole(FIELD_CASH_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const expense = await getFieldExpense((await params).id);
  if (!expense) notFound();
  const files = await listAttachments("field_cash_expense", expense.id);
  const pending = expense.status === "pending";
  const canAttach = pending && (profile.role === "finance" || profile.role === "field");
  const finance = profile.role === "finance";
  const cancelAction = async (reason: string) => {
    "use server";
    return cancelFieldExpense({ id: expense.id, reason });
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={expense.description}
        description={`${expense.project?.code ?? "—"} · ${formatDate(expense.expense_date)}`}
        actions={
          finance && pending ? (
            <ReasonDialogButton
              label="Batalkan"
              variant="outline"
              title="Batalkan pengeluaran?"
              description="Hanya pengeluaran yang menunggu verifikasi yang dapat dibatalkan."
              confirmLabel="Batalkan"
              action={cancelAction}
            />
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant={FIELD_STATUS_VARIANTS[expense.status] ?? "outline"}>{FIELD_STATUS_LABELS[expense.status]}</Badge>
        <Badge variant="outline">{FIELD_KIND_LABELS[expense.kind]}</Badge>
        <Link href={`/finance/field-cash/${expense.project_id}`} className="text-sm underline-offset-4 hover:underline">
          Buku kas proyek
        </Link>
      </div>
      {finance && pending ? (
        <Card>
          <CardHeader>
            <CardTitle>Verifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <LedgerTable
              canVerify
              rows={[
                {
                  id: expense.id,
                  kind: expense.kind,
                  entry_date: expense.expense_date,
                  amount: Number(expense.amount),
                  description: expense.description,
                  category_name: expense.category?.name ?? null,
                  employee_name: expense.employee?.full_name ?? null,
                  status: expense.status,
                  reject_reason: expense.reject_reason,
                  no_receipt: expense.no_receipt,
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Jumlah", formatRupiah(Number(expense.amount))],
              ["Kategori", expense.category?.name ?? "—"],
              ["Karyawan", expense.employee?.full_name ?? "—"],
              ["Cicilan kasbon", expense.installment_amount ? formatRupiah(Number(expense.installment_amount)) : "—"],
              ["Tanpa nota", expense.no_receipt ? `Ya — ${expense.no_receipt_note}` : "Tidak"],
              ["Alasan ditolak", expense.reject_reason ?? "—"],
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
          <CardTitle>Foto nota</CardTitle>
          <CardDescription>Dapat ditambahkan selama menunggu verifikasi; unggah ulang bila sinyal putus.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttachmentList entityType="field_cash_expense" entityId={expense.id} attachments={files.rows} categories={["receipt"]} canManage={canAttach} />
        </CardContent>
      </Card>
    </div>
  );
}
