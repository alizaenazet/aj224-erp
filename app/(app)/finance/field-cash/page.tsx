import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { MobileList } from "@/components/app/mobile-list";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { PAYABLE_VIEW_ROLES } from "@/lib/bills/labels";
import { fieldCashBalances } from "@/lib/bills/queries";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Kas Lapangan" };

export default function FieldCashPage() {
  return (
    <>
      <PageHeader
        title="Kas Lapangan"
        description="Saldo = top-up − pengeluaran (menunggu + disetujui) − pengembalian. Hanya Biaya Proyek yang disetujui menjadi biaya proyek."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <FieldCashContent />
      </Suspense>
    </>
  );
}

async function FieldCashContent() {
  const profile = await requireRole(PAYABLE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const rows = await fieldCashBalances();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo per proyek</CardTitle>
        <CardDescription>Buka proyek untuk top-up, pengembalian, dan verifikasi pengeluaran.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyek</TableHead>
                    <TableHead className="text-right">Top-up</TableHead>
                    <TableHead className="text-right">Disetujui</TableHead>
                    <TableHead className="text-right">Menunggu</TableHead>
                    <TableHead className="text-right">Dikembalikan</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.project_id}>
                      <TableCell className="whitespace-normal">
                        <Link href={`/finance/field-cash/${row.project_id}`} className="font-medium underline-offset-4 hover:underline">
                          {row.project_code}
                        </Link>
                        <div className="text-xs text-muted-foreground">{row.project_name}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(row.topups)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(row.approved)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.pending_count ? <Badge variant="warning">{row.pending_count} · {formatRupiah(row.pending)}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(row.returns)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatRupiah(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <MobileList
              rows={rows.map((row) => ({
                key: row.project_id,
                title: (
                  <>
                    <Link href={`/finance/field-cash/${row.project_id}`} className="underline-offset-4 hover:underline">
                      {row.project_code}
                    </Link>
                    <span className="text-xs font-normal text-muted-foreground">{row.project_name}</span>
                  </>
                ),
                aside: row.pending_count ? <Badge variant="warning">{row.pending_count} menunggu</Badge> : undefined,
                fields: [
                  { key: "balance", label: "Saldo", value: <span className="font-medium">{formatRupiah(row.balance)}</span> },
                  { key: "topups", label: "Top-up", value: formatRupiah(row.topups) },
                  { key: "approved", label: "Disetujui", value: formatRupiah(row.approved) },
                  { key: "pending", label: "Menunggu", value: row.pending_count ? formatRupiah(row.pending) : "—" },
                  { key: "returns", label: "Dikembalikan", value: formatRupiah(row.returns) },
                ],
              }))}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada kas lapangan. Top-up dicatat dari halaman proyek di sini.</p>
        )}
      </CardContent>
    </Card>
  );
}
