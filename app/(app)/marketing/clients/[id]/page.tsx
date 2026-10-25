import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { AccessDenied } from "@/components/app/access-denied";
import { PageHeader } from "@/components/app/page-header";
import { ActivityLog } from "@/components/clients/activity-log";
import { ClientActions } from "@/components/clients/client-actions";
import { ClientContacts } from "@/components/clients/client-contacts";
import { TenderStatusBadge } from "@/components/tenders/tender-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import {
  CLIENT_KIND_LABELS,
  CLIENT_MANAGE_ROLES,
  MARKETING_VIEW_ROLES,
  formatRate,
} from "@/lib/clients/labels";
import { clientContacts, getClient, listActivities } from "@/lib/clients/queries";
import { formatDate, formatRupiah, todayWib } from "@/lib/format";
import { clientTenders } from "@/lib/tenders/queries";

export const metadata: Metadata = { title: "Detail Klien" };

const TABS = ["summary", "contacts", "activities", "tenders"];

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string | string[] }>;

export default function ClientDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ClientDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ClientDetailContent({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const profile = await requireRole(MARKETING_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const client = await getClient((await params).id);
  if (!client) notFound();

  const [contacts, activities, tenders] = await Promise.all([
    clientContacts(client.id),
    listActivities({ clientId: client.id }),
    clientTenders(client.id),
  ]);
  const canManage = hasAnyRole(profile.role, CLIENT_MANAGE_ROLES);
  const requested = (await searchParams).tab;
  const defaultTab = typeof requested === "string" && TABS.includes(requested) ? requested : "summary";
  const { stats } = client;

  const summary: [string, string][] = [
    ["Jenis", CLIENT_KIND_LABELS[client.kind]],
    ["NPWP", client.npwp ?? "—"],
    ["Termin pembayaran default", `${client.payment_term_days} hari`],
    ["Alamat", client.address ?? "—"],
    ["Catatan", client.notes ?? "—"],
  ];
  const figures: [string, string][] = [
    ["Jumlah tender", String(stats.tender_count)],
    ["Menang / Kalah", `${stats.won_count} / ${stats.lost_count}`],
    ["Win rate (jumlah)", formatRate(stats.win_rate_count)],
    ["Win rate (nilai)", formatRate(stats.win_rate_value)],
    ["Nilai tender menang", formatRupiah(stats.won_value)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={client.name}
        description={CLIENT_KIND_LABELS[client.kind]}
        actions={
          <ClientActions
            client={client}
            canManage={canManage}
            canViewHistory={hasAnyRole(profile.role, ["super_admin", "director"])}
          />
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant={client.is_active ? "secondary" : "destructive"}>{client.is_active ? "Aktif" : "Nonaktif"}</Badge>
        <Badge variant="outline">Win rate {formatRate(stats.win_rate_count)}</Badge>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="contacts">Kontak ({contacts.length})</TabsTrigger>
          <TabsTrigger value="activities">Aktivitas</TabsTrigger>
          <TabsTrigger value="tenders">Tender ({tenders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="pt-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Data klien</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                  {summary.map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="break-words whitespace-pre-line">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Rekam jejak tender</CardTitle>
                <CardDescription>Win rate = Menang ÷ (Menang + Kalah); tender Batal tidak dihitung.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                  {figures.map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-base font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="pt-2">
          <ClientContacts clientId={client.id} contacts={contacts} canManage={canManage} />
        </TabsContent>

        <TabsContent value="activities" className="pt-2">
          <ActivityLog
            clientId={client.id}
            activities={activities}
            tenders={tenders.map((tender) => ({ value: tender.id, label: tender.name }))}
            today={todayWib()}
            canLog={canManage}
            currentUserId={profile.id}
            isSuperAdmin={profile.role === "super_admin"}
          />
        </TabsContent>

        <TabsContent value="tenders" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat tender</CardTitle>
              {profile.role === "marketing" ? (
                <CardAction>
                  <Button asChild size="sm">
                    <Link href={`/marketing/tenders/new?client=${client.id}`}>Tambah tender</Link>
                  </Button>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              {tenders.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Belum ada tender</EmptyTitle>
                    <EmptyDescription>Tender untuk klien ini akan tampil di sini.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paket</TableHead>
                      <TableHead>Tegangan</TableHead>
                      <TableHead>Batas Penawaran</TableHead>
                      <TableHead>Nilai Penawaran</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenders.map((tender) => (
                      <TableRow key={tender.id}>
                        <TableCell className="max-w-80 whitespace-normal">
                          <Link href={`/marketing/tenders/${tender.id}`} className="font-medium underline-offset-4 hover:underline">
                            {tender.name}
                          </Link>
                        </TableCell>
                        <TableCell>{tender.voltage_kv ? `${tender.voltage_kv} kV` : "—"}</TableCell>
                        <TableCell>{formatDate(tender.bid_deadline)}</TableCell>
                        <TableCell>{formatRupiah(tender.bid_value)}</TableCell>
                        <TableCell>
                          <TenderStatusBadge status={tender.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
