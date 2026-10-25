import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { ActivityLog } from "@/components/clients/activity-log";
import { TenderActions } from "@/components/tenders/tender-actions";
import { TenderStatusBadge, TenderUrgencyBadge } from "@/components/tenders/tender-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttachments } from "@/lib/attachments/queries";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { MARKETING_VIEW_ROLES, formatRate } from "@/lib/clients/labels";
import { listActivities } from "@/lib/clients/queries";
import { formatDate, formatDateTime, formatNumber, formatRupiah, todayWib } from "@/lib/format";
import { LOST_REASON_LABELS, formatPercent } from "@/lib/tenders/labels";
import { getTender, tenderRevisions } from "@/lib/tenders/queries";

export const metadata: Metadata = { title: "Detail Tender" };

type Params = Promise<{ id: string }>;

export default function TenderDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <TenderDetailContent params={params} />
    </Suspense>
  );
}

async function TenderDetailContent({ params }: { params: Params }) {
  const profile = await requireRole(MARKETING_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const tender = await getTender((await params).id);
  if (!tender) notFound();

  const today = todayWib();
  const canManage = profile.role === "marketing";
  const [revisions, documents, activities] = await Promise.all([
    tenderRevisions(tender.id),
    listAttachments("tender", tender.id),
    listActivities({ tenderId: tender.id }),
  ]);

  const data: [string, string][] = [
    ["Klien", tender.client?.name ?? "—"],
    ["Pemilik akhir", tender.end_owner ?? "—"],
    ["Lokasi", tender.location ?? "—"],
    ["Tegangan", tender.voltage_kv ? `${tender.voltage_kv} kV` : "—"],
    ["Panjang", tender.length_kms === null ? "—" : `${formatNumber(tender.length_kms, 2)} kms`],
    ["Jumlah tower", tender.tower_count === null ? "—" : formatNumber(tender.tower_count)],
    ["Tanggal informasi", formatDate(tender.info_date)],
    ["Batas penawaran", formatDate(tender.bid_deadline)],
    ["PIC", tender.pic_name ?? "—"],
    ["Lingkup pekerjaan", tender.scope ?? "—"],
    ["Catatan", tender.notes ?? "—"],
  ];
  const numbers: [string, string][] = [
    ["Nilai penawaran", formatRupiah(tender.bid_value)],
    ["Estimasi biaya (HPP)", formatRupiah(tender.estimated_cost)],
    ["Margin rencana", formatPercent(tender.planned_margin)],
    ["Peluang menang", tender.win_probability === null ? "—" : `${tender.win_probability}%`],
    ["Nilai tertimbang", formatRupiah(tender.weighted_value)],
    ["Win rate klien", formatRate(tender.client_stats?.win_rate_count)],
  ];
  const closing: [string, string][] =
    tender.status === "lost"
      ? [
          ["Tanggal penutupan", formatDate(tender.closed_date)],
          ["Alasan kalah", tender.lost_reason ? LOST_REASON_LABELS[tender.lost_reason] : "—"],
          ["Pemenang", tender.winner_name ?? "—"],
          ["Harga pemenang", formatRupiah(tender.winner_price)],
          ["Keterangan", tender.lost_note ?? "—"],
        ]
      : tender.closed_date
        ? [["Tanggal penutupan", formatDate(tender.closed_date)]]
        : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={tender.name}
        description={tender.client?.name ?? undefined}
        actions={
          <TenderActions
            tender={tender}
            today={today}
            canManage={canManage}
            canViewHistory={hasAnyRole(profile.role, ["super_admin", "director"])}
          />
        }
      />
      <div className="flex flex-wrap gap-2">
        <TenderStatusBadge status={tender.status} />
        <TenderUrgencyBadge status={tender.status} bidDeadline={tender.bid_deadline} today={today} />
        {tender.voltage_kv ? <Badge variant="outline">{tender.voltage_kv} kV</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Data tender</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {data.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-words whitespace-pre-line">
                    {label === "Klien" && tender.client ? (
                      <Link href={`/marketing/clients/${tender.client_id}`} className="underline-offset-4 hover:underline">
                        {value}
                      </Link>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Nilai</CardTitle>
              <CardDescription>Margin = (penawaran − estimasi) ÷ penawaran.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                {numbers.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          {closing.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Hasil tender</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3 text-sm">
                  {closing.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat revisi penawaran</CardTitle>
          <CardDescription>Tersimpan otomatis setiap nilai penawaran berubah.</CardDescription>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nilai penawaran belum diisi.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Nilai lama</TableHead>
                  <TableHead>Nilai baru</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revisions.map((revision) => (
                  <TableRow key={revision.id}>
                    <TableCell>{formatDateTime(revision.revised_at)}</TableCell>
                    <TableCell>{revision.old_value === null ? "—" : formatRupiah(revision.old_value)}</TableCell>
                    <TableCell className="font-medium">{formatRupiah(revision.new_value)}</TableCell>
                    <TableCell className="max-w-80 whitespace-normal">{revision.note ?? "—"}</TableCell>
                    <TableCell>{revision.revised_by_name ?? "Sistem"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumen</CardTitle>
          <CardDescription>RKS, BoQ, surat penawaran, dan dokumen lain.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttachmentList
            entityType="tender"
            entityId={tender.id}
            attachments={documents.rows}
            categories={["rks", "boq", "offer_letter", "other"]}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      <ActivityLog
        clientId={tender.client_id}
        activities={activities}
        tenders={[{ value: tender.id, label: tender.name }]}
        tenderId={tender.id}
        today={today}
        canLog={hasAnyRole(profile.role, ["super_admin", "marketing"])}
        currentUserId={profile.id}
        isSuperAdmin={profile.role === "super_admin"}
        description="Aktivitas dengan klien yang terkait tender ini."
      />
    </div>
  );
}
