import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { SpendingForm } from "@/components/field-cash/spending-form";
import { requireRole } from "@/lib/auth/session";
import { fieldCashFormOptions } from "@/lib/bills/queries";
import { addDays } from "@/lib/daily-reports/context";
import { backdateDays } from "@/lib/daily-reports/queries";
import { todayWib } from "@/lib/format";
import { parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Catat Pengeluaran" };

type SearchParams = Promise<RawSearchParams>;

export default function NewFieldExpensePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Catat Pengeluaran" description="Kas lapangan" />
      <Suspense fallback={<ContentSkeleton />}>
        <NewFieldExpense searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewFieldExpense({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(["finance", "field"]);
  if (!profile) return <AccessDenied />;
  const [raw, options, days] = await Promise.all([searchParams, fieldCashFormOptions(profile.role), backdateDays()]);
  if (!options.projects.length) return <p className="text-sm text-muted-foreground">Tidak ada proyek aktif.</p>;
  const today = todayWib();
  return (
    <SpendingForm
      projects={options.projects}
      categories={options.categories}
      employees={options.employees}
      defaultProject={parseText(raw.project)}
      today={today}
      minDate={profile.role === "field" ? addDays(today, -days) : null}
    />
  );
}
