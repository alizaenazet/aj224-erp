import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { CancelKasbonButton, KasbonDialogButton } from "@/components/kasbon/kasbon-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { KASBON_MANAGE_ROLES, KASBON_VIEW_ROLES } from "@/lib/bills/labels";
import { employeeOptions, parseKasbonListParams, queryKasbons } from "@/lib/bills/queries";
import { formatDate, formatRupiah, todayWib } from "@/lib/format";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Kasbon" };

type SearchParams = Promise<RawSearchParams>;

const SOURCE_LABELS: Record<string, string> = { manual: "Manual", field_cash: "Kas lapangan", opening: "Saldo awal" };

export default function KasbonPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Kasbon" description="Pinjaman/uang muka gaji karyawan; cicilan dipotong di payroll." />
      <Suspense fallback={<ContentSkeleton />}>
        <KasbonContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function KasbonContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(KASBON_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const raw = await searchParams;
  const params = parseKasbonListParams(raw);
  const manage = hasAnyRole(profile.role, KASBON_MANAGE_ROLES);
  const [{ rows, count }, employees] = await Promise.all([queryKasbons(params, { page: params.page }), manage ? employeeOptions() : Promise.resolve([])]);
  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        searchPlaceholder="Cari nama atau NIK karyawan"
        filters={<SelectFilter param="open" allLabel="Semua kasbon" options={[{ value: "1", label: "Masih ada saldo" }]} />}
        actions={
          <>
            <ExportButton exportKey="kasbon" />
            {manage ? <KasbonDialogButton employees={employees} today={todayWib()} /> : null}
          </>
        }
      />
      <Card>
        <CardContent>
          {rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Cicilan</TableHead>
                  <TableHead className="text-right">Dipotong</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Sumber</TableHead>
                  {manage ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-normal">
                      {row.full_name}
                      <div className="text-xs text-muted-foreground">
                        {row.employee_no}
                        {row.description ? ` · ${row.description}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(row.kasbon_date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(row.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(row.installment_amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(row.deducted)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatRupiah(row.balance)}</TableCell>
                    <TableCell>
                      {row.status === "cancelled" ? <Badge variant="destructive">Batal</Badge> : <Badge variant="outline">{SOURCE_LABELS[row.source]}</Badge>}
                    </TableCell>
                    {manage ? (
                      <TableCell className="text-right">{row.status === "active" && row.deducted === 0 ? <CancelKasbonButton id={row.id} /> : null}</TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada kasbon.</p>
          )}
        </CardContent>
      </Card>
      <ListPagination page={params.page} pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))} hrefForPage={(page) => withPage(raw, "/hr/kasbon", page)} />
    </div>
  );
}
