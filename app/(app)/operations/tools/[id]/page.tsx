import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { ConditionBadge } from "@/components/equipment/badges";
import { StockTable } from "@/components/equipment/stock-table";
import { ToolActions } from "@/components/equipment/tool-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import {
  EQUIPMENT_VIEW_ROLES,
  MOVEMENT_LABELS,
  OWNERSHIP_LABELS,
  RENTAL_PERIOD_LABELS,
  TRACKING_LABELS,
} from "@/lib/equipment/labels";
import { getTool, toolFormOptions, toolMovements, toolStays, toolStock } from "@/lib/equipment/queries";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Detail Alat" };

type Params = Promise<{ id: string }>;

export default function ToolPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ToolContent params={params} />
    </Suspense>
  );
}

/** One tool: stock, condition changes, history and stays (ALT-01 … ALT-06). */
async function ToolContent({ params }: { params: Params }) {
  const profile = await requireRole(EQUIPMENT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const tool = await getTool((await params).id);
  if (!tool) notFound();

  const isOps = profile.role === "operations";
  const [stock, movements, stays, photos, options] = await Promise.all([
    toolStock(tool.id),
    toolMovements(tool.id),
    tool.tracking === "unit" ? toolStays(tool.id) : Promise.resolve([]),
    listAttachments("tool", tool.id),
    isOps ? toolFormOptions() : Promise.resolve({ categories: [], suppliers: [], locations: [] }),
  ]);
  const canChangeCondition = isOps || profile.role === "field";

  const info: [string, string][] = [
    ["Kategori", tool.category_name],
    ["Pelacakan", TRACKING_LABELS[tool.tracking]],
    ["No. seri", tool.serial_no ?? "—"],
    ["Kepemilikan", OWNERSHIP_LABELS[tool.ownership]],
    ...(tool.ownership === "rented"
      ? ([
          ["Supplier", tool.supplier_name ?? "—"],
          ["Tarif sewa", `${formatRupiah(Number(tool.rental_rate))} ${tool.rental_period ? RENTAL_PERIOD_LABELS[tool.rental_period] : ""}`],
        ] as [string, string][])
      : []),
    ["Total", `${tool.total} (Baik ${tool.good}, Rusak ${tool.damaged}, Perbaikan ${tool.repair}, Hilang ${tool.lost}, di jalan ${tool.in_transit})`],
    ["Catatan", tool.notes ?? "—"],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${tool.code} · ${tool.name}`}
        description={tool.category_name}
        actions={
          <ToolActions
            tool={tool}
            canManage={isOps}
            canViewHistory={hasAnyRole(profile.role, ["super_admin", "director"])}
            options={options}
          />
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant={tool.ownership === "rented" ? "warning" : "outline"}>{OWNERSHIP_LABELS[tool.ownership]}</Badge>
        {tool.is_active ? null : <Badge variant="outline">Nonaktif</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Data alat</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {info.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Foto</CardTitle>
            <CardDescription>Foto alat dan foto kondisi (rusak/perbaikan).</CardDescription>
          </CardHeader>
          <CardContent>
            <AttachmentList
              entityType="tool"
              entityId={tool.id}
              attachments={photos.rows}
              categories={isOps ? ["photo", "condition"] : ["condition"]}
              canManage={canChangeCondition}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok per lokasi & kondisi</CardTitle>
          <CardDescription>
            {canChangeCondition ? "Ubah kondisi saat alat rusak, hilang, atau selesai diperbaiki." : "Jumlah alat per lokasi dan kondisi."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTable
            mode="tool"
            canChangeCondition={canChangeCondition}
            adjust={isOps ? { toolId: tool.id, locations: options.locations } : null}
            rows={stock.map((row) => ({
              tool_id: row.tool_id,
              tool_label: tool.code,
              location_id: row.location_id,
              location_label: row.location_name,
              condition: row.condition,
              quantity: row.quantity,
            }))}
          />
        </CardContent>
      </Card>

      {tool.tracking === "unit" ? (
        <Card>
          <CardHeader>
            <CardTitle>Lama di tiap lokasi</CardTitle>
            <CardDescription>Dihitung dari tanggal tiba sampai dikirim keluar (atau hari ini).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Tiba</TableHead>
                  <TableHead>Keluar</TableHead>
                  <TableHead className="text-right">Hari</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stays.map((stay) => (
                  <TableRow key={stay.start_at ?? ""}>
                    <TableCell className="max-w-80 whitespace-normal">{stay.location_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(stay.start_at)}</TableCell>
                    <TableCell className="whitespace-nowrap">{stay.end_at ? formatDate(stay.end_at) : "Masih di sini"}</TableCell>
                    <TableCell className="text-right tabular-nums">{stay.days}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat</CardTitle>
          <CardDescription>Saldo awal, pengiriman, penerimaan, perubahan kondisi, dan penyesuaian.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Oleh</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(movement.created_at)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {MOVEMENT_LABELS[movement.kind] ?? movement.kind}
                    {movement.note_number && movement.delivery_note_id ? (
                      <>
                        {" · "}
                        <Link
                          href={`/operations/delivery-notes/${movement.delivery_note_id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {movement.note_number}
                        </Link>
                      </>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    {movement.from_location && movement.to_location && movement.from_location !== movement.to_location
                      ? `${movement.from_location} → ${movement.to_location}`
                      : (movement.to_location ?? movement.from_location ?? "—")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {movement.from_condition ? <ConditionBadge condition={movement.from_condition} /> : null}
                      {movement.from_condition && movement.to_condition ? "→" : null}
                      {movement.to_condition ? <ConditionBadge condition={movement.to_condition} /> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{movement.quantity}</TableCell>
                  <TableCell>{movement.created_by_name ?? "Sistem"}</TableCell>
                  <TableCell className="max-w-64 whitespace-normal">{movement.note ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
