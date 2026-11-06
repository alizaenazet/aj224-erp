import type { Metadata } from "next";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import {
  MATERIAL_OFFICE_VIEW_ROLES,
  MATERIAL_OWNERSHIP_LABELS,
  MOVEMENT_LABELS,
  formatQuantity,
} from "@/lib/materials/labels";
import { getMaterial, materialMovements, materialStock } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Material" };

type Params = Promise<{ id: string }>;

export default function MaterialPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <MaterialContent params={params} />
    </Suspense>
  );
}

/** One material: stock per location and its movement history (MAT-01 … MAT-05). */
async function MaterialContent({ params }: { params: Params }) {
  const profile = await requireRole(MATERIAL_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const material = await getMaterial((await params).id);
  if (!material) notFound();
  const [stock, movements] = await Promise.all([materialStock(material.id), materialMovements(material.id)]);
  const unit = material.unit_code;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${material.code} — ${material.name}`}
        description={`${material.category_name} · ${material.unit_name}`}
        actions={
          profile.role === "operations" ? (
            <Button asChild variant="outline">
              <Link href={`/operations/materials/${material.id}/edit`}>
                <PencilIcon />
                Ubah
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant={material.ownership === "client" ? "secondary" : "outline"}>{MATERIAL_OWNERSHIP_LABELS[material.ownership]}</Badge>
        {material.is_active ? null : <Badge variant="outline">Nonaktif</Badge>}
        {material.low_locations ? <Badge variant="warning">Di bawah minimum di {material.low_locations} lokasi</Badge> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Stok di lokasi", material.on_hand],
          ["Dalam perjalanan", material.in_transit],
          ["Stok minimum", material.min_stock],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="tabular-nums">
                {value === null ? "—" : `${formatQuantity(value as number)} ${unit}`}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok per lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          {stock.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((row) => (
                  <TableRow key={row.location_id}>
                    <TableCell className="whitespace-normal">
                      {row.location_code} — {row.location_name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        {material.ownership === "company" && material.min_stock !== null && row.quantity < material.min_stock ? (
                          <Badge variant="warning">Di bawah minimum</Badge>
                        ) : null}
                        {formatQuantity(row.quantity)} {unit}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada stok.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat pergerakan</CardTitle>
          <CardDescription>200 pergerakan terakhir.</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Perubahan stok</TableHead>
                  <TableHead>Referensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(row.created_at)}
                      <div className="text-xs text-muted-foreground">{row.created_by_name ?? "Sistem"}</div>
                    </TableCell>
                    <TableCell>{MOVEMENT_LABELS[row.kind] ?? row.kind}</TableCell>
                    <TableCell className="whitespace-normal">{row.location_name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.kind === "shortfall"
                        ? `${formatQuantity(row.quantity)} ${unit} hilang`
                        : `${row.delta > 0 ? "+" : ""}${formatQuantity(row.delta)} ${unit}`}
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal">
                      {row.delivery_note_id ? (
                        <Link href={`/operations/delivery-notes/${row.delivery_note_id}`} className="underline-offset-4 hover:underline">
                          {row.note_number}
                        </Link>
                      ) : row.transaction_id ? (
                        <Link href={`/operations/material-transactions/${row.transaction_id}`} className="underline-offset-4 hover:underline">
                          Transaksi
                        </Link>
                      ) : null}
                      {row.note ? <div className="text-xs text-muted-foreground">{row.note}</div> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada pergerakan.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
