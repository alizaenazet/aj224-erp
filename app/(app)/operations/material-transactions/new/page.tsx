import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TransactionForm } from "@/components/materials/transaction-form";
import { requireRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { parseEnum, parseText, type RawSearchParams } from "@/lib/list/params";
import { RECORDABLE_KINDS, TXN_KIND_LABELS } from "@/lib/materials/labels";
import { transactionFormData } from "@/lib/materials/queries";
import { addDays } from "@/lib/daily-reports/context";
import { backdateDays } from "@/lib/daily-reports/queries";

export const metadata: Metadata = { title: "Catat Transaksi Material" };

type SearchParams = Promise<RawSearchParams>;

export default function NewMaterialTransactionPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <NewTransactionContent searchParams={searchParams} />
    </Suspense>
  );
}

/** Terima / Pakai Material (MAT-02, MAT-03) and Kembali ke klien (Operasional). */
async function NewTransactionContent({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const kind = parseEnum(raw.kind, RECORDABLE_KINDS) ?? "receipt";
  const profile = await requireRole(kind === "return" ? ["operations"] : ["operations", "field"]);
  if (!profile) return <AccessDenied />;

  const [data, days] = await Promise.all([transactionFormData(profile.role), backdateDays()]);
  const today = todayWib();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={TXN_KIND_LABELS[kind]} description="Material & Stok" />
      <TransactionForm
        kind={kind}
        locations={data.locations}
        defaultLocation={parseText(raw.location)}
        materials={data.materials}
        suppliers={data.suppliers}
        stock={data.stock}
        sections={data.sections}
        today={today}
        minDate={profile.role === "field" ? addDays(today, -days) : null}
      />
    </div>
  );
}
