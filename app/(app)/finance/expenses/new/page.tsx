import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { requireRole } from "@/lib/auth/session";
import { FINANCE_MANAGE_ROLES } from "@/lib/bills/labels";
import { costFormOptions } from "@/lib/bills/queries";
import { todayWib } from "@/lib/format";
import { parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Pengeluaran Baru" };

type SearchParams = Promise<RawSearchParams>;

export default function NewExpensePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Pengeluaran Baru" />
      <Suspense fallback={<ContentSkeleton />}>
        <NewExpenseContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewExpenseContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(FINANCE_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const [raw, options] = await Promise.all([searchParams, costFormOptions()]);
  return (
    <ExpenseForm
      projects={options.projects}
      categories={options.categories}
      deliveryNotes={options.deliveryNotes}
      today={todayWib()}
      defaultProject={parseText(raw.project)}
    />
  );
}
