import type { Metadata } from "next";
import { PackageMinusIcon, PackagePlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { MobileList } from "@/components/app/mobile-list";
import { ExportButton } from "@/components/data-table/export-button";
import { ReconciliationTable } from "@/components/materials/reconciliation-table";
import { TransactionsTable } from "@/components/materials/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { MATERIAL_OWNERSHIP_LABELS, MATERIAL_VIEW_ROLES, formatQuantity } from "@/lib/materials/labels";
import { locationMaterialStock, queryReconciliation, queryTransactions } from "@/lib/materials/queries";
import { PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Material Proyek" };

type Params = Promise<{ id: string }>;

export default function ProjectMaterialsPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectMaterials params={params} />
    </Suspense>
  );
}

/** Material tab: stock at the project location, recent transactions and titipan reconciliation (MAT-02 … MAT-06). */
async function ProjectMaterials({ params }: { params: Params }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, MATERIAL_VIEW_ROLES)) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();
  if (!project.location_id) return <p className="text-sm text-muted-foreground">Proyek belum memiliki lokasi.</p>;

  const [stock, transactions, reconciliation] = await Promise.all([
    locationMaterialStock(project.location_id),
    queryTransactions(
      { q: null, kind: null, status: null, location: project.location_id, range: { from: null, to: null, gte: null, lt: null }, page: 1 },
      { page: 1 },
    ),
    queryReconciliation({ project: project.id, q: null }),
  ]);
  const canRecord = profile.role === "operations" || profile.role === "field";
  const location = project.location_id;

  return (
    <div className="flex flex-col gap-4">
      {canRecord ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link href={`/operations/material-transactions/new?kind=receipt&location=${location}`}>
              <PackagePlusIcon />
              Terima Material
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/operations/material-transactions/new?kind=usage&location=${location}`}>
              <PackageMinusIcon />
              Pakai Material
            </Link>
          </Button>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Stok di lokasi proyek</CardTitle>
          <CardDescription>Jumlah saja; biaya material dicatat di Keuangan.</CardDescription>
        </CardHeader>
        <CardContent>
          {stock.some((row) => row.quantity > 0) ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Kepemilikan</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stock
                      .filter((row) => row.quantity > 0)
                      .map((row) => (
                        <TableRow key={row.material_id}>
                          <TableCell className="max-w-72 whitespace-normal">
                            <span className="font-medium">{row.material_code}</span>
                            <div className="text-xs text-muted-foreground">{row.material_name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.ownership === "client" ? "secondary" : "outline"}>
                              {MATERIAL_OWNERSHIP_LABELS[row.ownership]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatQuantity(row.quantity)} {row.unit_code}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <MobileList
                rows={stock
                  .filter((row) => row.quantity > 0)
                  .map((row) => ({
                    key: row.material_id,
                    title: (
                      <>
                        {row.material_code}
                        <span className="text-xs font-normal text-muted-foreground">{row.material_name}</span>
                      </>
                    ),
                    aside: (
                      <Badge variant={row.ownership === "client" ? "secondary" : "outline"}>{MATERIAL_OWNERSHIP_LABELS[row.ownership]}</Badge>
                    ),
                    fields: [{ key: "quantity", label: "Jumlah", value: `${formatQuantity(row.quantity)} ${row.unit_code}`, full: true }],
                  }))}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada material di lokasi ini.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rekonsiliasi material titipan</CardTitle>
          <CardDescription>Dasar berita acara rekonsiliasi dengan klien.</CardDescription>
          {profile.role === "field" ? null : (
            <CardAction>
              <ExportButton exportKey="material-reconciliation" params={{ project: project.id }} />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <ReconciliationTable rows={reconciliation.rows} showProject={false} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transaksi terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable rows={transactions.rows} />
        </CardContent>
      </Card>
    </div>
  );
}
