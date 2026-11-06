import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { LedgerTable } from "@/components/field-cash/ledger-table";
import { MovementButtons } from "@/components/field-cash/movement-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { FIELD_CASH_VIEW_ROLES } from "@/lib/bills/labels";
import { costFormOptions, fieldCashBalance, fieldCashLedger } from "@/lib/bills/queries";
import { formatRupiah, todayWib } from "@/lib/format";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Kas Lapangan Proyek" };

type Params = Promise<{ projectId: string }>;

export default function ProjectFieldCashPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectFieldCash params={params} />
    </Suspense>
  );
}

/** Buku kas lapangan satu proyek (FIN-10); Lapangan sees only their projects (RLS). */
async function ProjectFieldCash({ params }: { params: Params }) {
  const profile = await requireRole(FIELD_CASH_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const project = await getProject((await params).projectId);
  if (!project) notFound();
  const finance = profile.role === "finance";
  const [balance, ledger, options] = await Promise.all([
    fieldCashBalance(project.id),
    fieldCashLedger(project.id),
    finance ? costFormOptions() : Promise.resolve(null),
  ]);
  const tiles: [string, number][] = [
    ["Saldo", balance?.balance ?? 0],
    ["Top-up", balance?.topups ?? 0],
    ["Menunggu verifikasi", balance?.pending ?? 0],
    ["Disetujui", balance?.approved ?? 0],
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Kas Lapangan · ${project.code}`}
        description={project.name}
        actions={
          <>
            {finance && options ? <MovementButtons projectId={project.id} balance={balance?.balance ?? 0} banks={options.banks} today={todayWib()} /> : null}
            {finance || profile.role === "field" ? (
              <Button asChild variant={finance ? "outline" : "default"}>
                <Link href={`/finance/field-cash/expenses/new?project=${project.id}`}>
                  <PlusIcon />
                  Catat Pengeluaran
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-xl tabular-nums">{formatRupiah(value)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Buku kas</CardTitle>
        </CardHeader>
        <CardContent>
          <LedgerTable rows={ledger} canVerify={finance} />
        </CardContent>
      </Card>
    </div>
  );
}
