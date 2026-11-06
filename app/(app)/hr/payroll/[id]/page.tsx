import type { Metadata } from "next";
import { PrinterIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { MobileList } from "@/components/app/mobile-list";
import { PageHeader } from "@/components/app/page-header";
import { ExportButton } from "@/components/data-table/export-button";
import { CorrectionButton, PeriodActions } from "@/components/payroll/period-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { employeeOptions } from "@/lib/bills/queries";
import { formatDate, formatRupiah, todayWib } from "@/lib/format";
import { GROUP_LABELS, PAYROLL_VIEW_ROLES, PERIOD_STATUS_LABELS, PERIOD_STATUS_VARIANTS } from "@/lib/payroll/labels";
import { getPeriod, periodRecap, periodSlips } from "@/lib/payroll/queries";

export const metadata: Metadata = { title: "Periode Gaji" };

type Params = Promise<{ id: string }>;

export default function PayrollPeriodPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <PeriodContent params={params} />
    </Suspense>
  );
}

async function PeriodContent({ params }: { params: Params }) {
  const profile = await requireRole(PAYROLL_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const period = await getPeriod((await params).id);
  if (!period) notFound();
  const [slips, recap, employees] = await Promise.all([
    periodSlips(period.id),
    periodRecap(period.id),
    profile.role === "hcm" ? employeeOptions() : Promise.resolve([]),
  ]);
  const flagged = slips.filter((slip) => slip.incomplete_attendance || slip.unverified);
  const unverified = slips.filter((slip) => slip.unverified);
  const today = todayWib();
  const exportParams = { period: period.id };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={period.name}
        description={`${GROUP_LABELS[period.group_kind]} · ${formatDate(period.period_start)} – ${formatDate(period.period_end)}`}
        actions={
          <>
            <PeriodActions periodId={period.id} status={period.status} role={profile.role} today={today} />
            {profile.role === "hcm" ? <CorrectionButton employees={employees} today={today} /> : null}
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant={PERIOD_STATUS_VARIANTS[period.status]}>{PERIOD_STATUS_LABELS[period.status]}</Badge>
        {flagged.length ? <Badge variant="warning">{flagged.length} slip ditandai</Badge> : null}
      </div>
      {period.return_note ? (
        <Alert variant="warning">
          <AlertTitle>Dikembalikan Direktur</AlertTitle>
          <AlertDescription>{period.return_note}</AlertDescription>
        </Alert>
      ) : null}
      {unverified.length ? (
        <Alert variant="destructive">
          <AlertTitle>Pekerja belum diverifikasi HCM</AlertTitle>
          <AlertDescription>{unverified.map((slip) => slip.full_name).join(", ")} — payroll tidak dapat disetujui sebelum diverifikasi.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Slip gaji</CardTitle>
          <CardDescription>Tanda kuning: absensi belum lengkap (hari tercatat kurang dari hari aktif).</CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/print/payrolls/${period.id}`} target="_blank">
                <PrinterIcon />
                Cetak semua
              </Link>
            </Button>
            <ExportButton exportKey="payslips" params={exportParams} />
            {profile.role !== "hcm" ? <ExportButton exportKey="payroll-transfer" params={exportParams} /> : null}
          </CardAction>
        </CardHeader>
        <CardContent>
          {slips.length ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Karyawan</TableHead>
                      <TableHead className="text-right">Hadir</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Potongan</TableHead>
                      <TableHead className="text-right">Bersih</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slips.map((slip) => (
                      <TableRow key={slip.id}>
                        <TableCell className="whitespace-normal">
                          <Link href={`/hr/payroll/${period.id}/slips/${slip.id}`} className="font-medium underline-offset-4 hover:underline">
                            {slip.full_name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {slip.employee_no} · {slip.projects ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {slip.present_days}/{slip.active_days}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(slip.gross)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(slip.total_deductions)}</TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">{formatRupiah(slip.net)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {slip.status === "paid" ? <Badge variant="success">Dibayar</Badge> : null}
                            {slip.incomplete_attendance ? <Badge variant="warning">Absensi belum lengkap</Badge> : null}
                            {slip.unverified ? <Badge variant="destructive">Belum diverifikasi</Badge> : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatRupiah(period.gross_total)}</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-medium tabular-nums">{formatRupiah(period.net_total)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
              <MobileList
                rows={[
                  ...slips.map((slip) => ({
                    key: slip.id,
                    title: (
                      <>
                        <Link href={`/hr/payroll/${period.id}/slips/${slip.id}`} className="underline-offset-4 hover:underline">
                          {slip.full_name}
                        </Link>
                        <span className="text-xs font-normal text-muted-foreground">
                          {slip.employee_no} · {slip.projects ?? "—"}
                        </span>
                      </>
                    ),
                    aside: (
                      <>
                        {slip.status === "paid" ? <Badge variant="success">Dibayar</Badge> : null}
                        {slip.incomplete_attendance ? <Badge variant="warning">Absensi belum lengkap</Badge> : null}
                        {slip.unverified ? <Badge variant="destructive">Belum diverifikasi</Badge> : null}
                      </>
                    ),
                    fields: [
                      { key: "days", label: "Hadir", value: `${slip.present_days}/${slip.active_days}` },
                      { key: "gross", label: "Bruto", value: formatRupiah(slip.gross) },
                      { key: "deductions", label: "Potongan", value: formatRupiah(slip.total_deductions) },
                      { key: "net", label: "Bersih", value: <span className="font-medium">{formatRupiah(slip.net)}</span> },
                    ],
                  })),
                  {
                    key: "total",
                    title: "Total",
                    fields: [
                      { key: "gross", label: "Bruto", value: formatRupiah(period.gross_total) },
                      { key: "net", label: "Bersih", value: <span className="font-medium">{formatRupiah(period.net_total)}</span> },
                    ],
                  },
                ]}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{profile.role === "hcm" ? "Klik Hitung ulang untuk menyusun draf." : "Belum ada slip."}</p>
          )}
        </CardContent>
      </Card>

      {recap.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Rekap alokasi biaya gaji</CardTitle>
            <CardDescription>Pendapatan bruto dibagi ke proyek menurut hari hadir (PAY-08); masuk realisasi Upah & Gaji.</CardDescription>
            <CardAction className="flex gap-2">
              {recap.map((row) =>
                row.project_id ? (
                  <Button key={row.project_id} asChild variant="outline" size="sm">
                    <Link href={`/print/payrolls/${period.id}?project=${row.project_id}`} target="_blank">
                      <PrinterIcon />
                      {row.project_code}
                    </Link>
                  </Button>
                ) : null,
              )}
              <ExportButton exportKey="payroll-recap" params={exportParams} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyek</TableHead>
                      <TableHead className="text-right">Karyawan</TableHead>
                      <TableHead className="text-right">Hari hadir</TableHead>
                      <TableHead className="text-right">Biaya gaji</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recap.map((row) => (
                      <TableRow key={row.project_code}>
                        <TableCell>{row.project_code}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.employees}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.days}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRupiah(row.allocated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <MobileList
                rows={recap.map((row) => ({
                  key: row.project_code,
                  title: row.project_code,
                  fields: [
                    { key: "employees", label: "Karyawan", value: row.employees },
                    { key: "days", label: "Hari hadir", value: row.days },
                    { key: "allocated", label: "Biaya gaji", value: formatRupiah(row.allocated), full: true },
                  ],
                }))}
              />
            </>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
