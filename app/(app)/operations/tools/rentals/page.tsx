import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { EQUIPMENT_OFFICE_VIEW_ROLES, RENTAL_PERIOD_LABELS, type RentalPeriod } from "@/lib/equipment/labels";
import { activeRentals } from "@/lib/equipment/queries";
import { formatDate, formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Alat Sewa Aktif" };

export default function RentalsPage() {
  return (
    <>
      <PageHeader title="Alat Sewa Aktif" description="Alat sewaan yang sedang berada di proyek, untuk mencocokkan tagihan vendor sewa." />
      <Suspense fallback={<ContentSkeleton />}>
        <RentalsContent />
      </Suspense>
    </>
  );
}

/** ALT-07: rented tools on projects with the estimated running cost. */
async function RentalsContent() {
  const profile = await requireRole(EQUIPMENT_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const rentals = await activeRentals();
  const total = rentals.reduce((sum, row) => sum + row.estimated_cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sedang disewa</CardTitle>
        <CardDescription>Biaya berjalan = tarif × jumlah × hari (atau × bulan untuk tarif bulanan), sejak tiba di proyek.</CardDescription>
      </CardHeader>
      <CardContent>
        {rentals.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Tidak ada alat sewa di proyek</EmptyTitle>
              <EmptyDescription>Alat sewaan yang dikirim ke proyek akan tampil di sini.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alat</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Tiba</TableHead>
                <TableHead className="text-right">Hari</TableHead>
                <TableHead className="text-right">Tarif</TableHead>
                <TableHead className="text-right">Estimasi biaya</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((row) => (
                <TableRow key={`${row.tool_id}-${row.project_id}`}>
                  <TableCell>
                    <Link href={`/operations/tools/${row.tool_id}`} className="font-medium underline-offset-4 hover:underline">
                      {row.code}
                    </Link>
                    <div className="text-xs text-muted-foreground">{row.name}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/projects/${row.project_id}/equipment`} className="underline-offset-4 hover:underline">
                      {row.project_code}
                    </Link>
                  </TableCell>
                  <TableCell>{row.supplier_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.arrived_at)}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.days}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatRupiah(row.rental_rate)} {RENTAL_PERIOD_LABELS[row.rental_period as RentalPeriod]}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">{formatRupiah(row.estimated_cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="font-medium">
                  Total estimasi
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">{formatRupiah(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
