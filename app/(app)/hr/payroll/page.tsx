import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { NewPeriodButton } from "@/components/payroll/period-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { formatDate, formatRupiah } from "@/lib/format";
import { GROUP_LABELS, PAYROLL_VIEW_ROLES, PERIOD_STATUS_LABELS, PERIOD_STATUS_VARIANTS } from "@/lib/payroll/labels";
import { listPeriods } from "@/lib/payroll/queries";

export const metadata: Metadata = { title: "Payroll" };

export default function PayrollPage() {
  return (
    <>
      <PageHeader title="Payroll" description="Draft (HCM) → Diajukan → Disetujui (Direktur) → Dibayar (Finance). Sejak diajukan, absensi periode dikunci; Direktur mengembalikan payroll bila absensi perlu diubah." />
      <Suspense fallback={<ContentSkeleton />}>
        <PayrollContent />
      </Suspense>
    </>
  );
}

async function PayrollContent() {
  const profile = await requireRole(PAYROLL_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const periods = await listPeriods();
  return (
    <div className="flex flex-col gap-4">
      {profile.role === "hcm" ? (
        <div>
          <NewPeriodButton />
        </div>
      ) : null}
      <Card>
        <CardContent>
          {periods.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Kelompok</TableHead>
                  <TableHead className="text-right">Slip</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Bersih</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="whitespace-normal">
                      <Link href={`/hr/payroll/${period.id}`} className="font-medium underline-offset-4 hover:underline">
                        {period.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(period.period_start)} – {formatDate(period.period_end)}
                      </div>
                    </TableCell>
                    <TableCell>{GROUP_LABELS[period.group_kind]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {period.slip_count}
                      {period.flagged ? <Badge variant="warning" className="ml-2">{period.flagged} ditandai</Badge> : null}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(period.gross_total)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(period.net_total)}</TableCell>
                    <TableCell>
                      <Badge variant={PERIOD_STATUS_VARIANTS[period.status]}>{PERIOD_STATUS_LABELS[period.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada periode gaji.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
