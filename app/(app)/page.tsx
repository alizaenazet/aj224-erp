import Link from "next/link";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ActionList } from "@/components/dashboard/action-list";
import { BarChartCard } from "@/components/dashboard/bar-chart-card";
import { HealthTable } from "@/components/dashboard/health-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { FieldHome } from "@/components/field/field-home";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import {
  directorDashboard,
  financeActions,
  hcmActions,
  marketingActions,
  operationsActions,
  type ActionGroup,
} from "@/lib/dashboard/queries";
import { formatNumber, formatRupiah, formatRupiahShort } from "@/lib/format";

export default function HomePage() {
  return (
    <>
      <PageHeader title="Beranda" />
      <Suspense fallback={<ContentSkeleton />}>
        <Home />
      </Suspense>
    </>
  );
}

function ActionGrid({ groups }: { groups: ActionGroup[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <ActionList key={group.title} group={group} />
      ))}
    </div>
  );
}

/** Beranda per peran (DSB-01 … DSB-04). */
async function Home() {
  const profile = await requireProfile();
  switch (profile.role) {
    case "field":
      return <FieldHome />;
    case "director":
      return <DirectorHome />;
    case "finance":
      return <ActionGrid groups={await financeActions()} />;
    case "marketing":
      return <ActionGrid groups={await marketingActions()} />;
    case "hcm":
      return <ActionGrid groups={await hcmActions()} />;
    case "operations":
      return <ActionGrid groups={await operationsActions()} />;
    default:
      return (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Selamat datang, {profile.full_name}</CardTitle>
              <CardDescription>Anda masuk sebagai {ROLE_LABELS[profile.role]}.</CardDescription>
            </CardHeader>
          </Card>
          {[
            ["/settings/users", "Pengguna & Peran", "Undang pengguna, ubah peran, nonaktifkan akun."],
            ["/settings/parameters", "Parameter Sistem", "Batas input mundur, ambang kesehatan, tarif PPN."],
            ["/settings/audit-log", "Log Audit", "Riwayat perubahan data keuangan, payroll, dan override."],
          ].map(([href, title, description]) => (
            <Link key={href} href={href} className="block">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      );
  }
}

async function DirectorHome() {
  const { cards, health, charts } = await directorDashboard();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Nilai kontrak aktif" value={formatRupiah(cards.activeContract)} shortValue={formatRupiahShort(cards.activeContract)} detail={`${cards.activeCount} proyek aktif`} href="/finance/pl" />
        <StatCard label="Nilai belum ditagih" value={formatRupiah(cards.unbilled)} shortValue={formatRupiahShort(cards.unbilled)} detail="Pekerjaan selesai − pendapatan diakui" href="/finance/pl" />
        <StatCard
          label="Piutang"
          value={formatRupiah(cards.receivable)}
          shortValue={formatRupiahShort(cards.receivable)}
          detail={`Lewat jatuh tempo ${formatRupiahShort(cards.receivableOverdue)}`}
          href="/finance/invoices?open=1"
        />
        <StatCard label="Utang" value={formatRupiah(cards.payable)} shortValue={formatRupiahShort(cards.payable)} detail={`Jatuh tempo ≤ 7 hari ${formatRupiahShort(cards.payableDue7)}`} href="/finance/bills" />
        <StatCard
          label="Win rate tahun ini"
          value={cards.winRate === null ? "—" : `${formatNumber(cards.winRate, 1)}%`}
          detail={`Pipeline ${formatRupiahShort(cards.pipeline)}`}
          href="/marketing/tender-analytics"
        />
        <StatCard
          label="Hari tanpa LTI"
          value={cards.ltiFreeDays === null ? "—" : formatNumber(cards.ltiFreeDays)}
          detail="Seluruh perusahaan"
          href="/operations/incidents/summary"
        />
        <StatCard
          label="Kru dengan sertifikat bermasalah"
          value={formatNumber(cards.certIssues)}
          detail={`${cards.overrides} penugasan dengan override`}
          href="/hr/assignments?state=active"
        />
        <StatCard label="Payroll menunggu persetujuan" value={formatNumber(cards.payrollPending)} detail="Periode diajukan HCM" href="/hr/payroll" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kesehatan proyek</CardTitle>
          <CardDescription>Normal / Waspada / Kritis menurut indeks biaya dan deviasi jadwal (PRD §11.3).</CardDescription>
        </CardHeader>
        <CardContent>
          <HealthTable rows={health} />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <BarChartCard title="Umur piutang" description="Sisa tagihan per kelompok hari terlambat" data={charts.aging} money tableHref="/finance/invoices/aging" />
        <BarChartCard title="Insiden K3 per bulan" description="Tahun berjalan, tanpa insiden batal" data={charts.incidents} tableHref="/operations/incidents/summary" />
        <BarChartCard title="Pipeline tender" description="Nilai penawaran tender aktif per status" data={charts.pipeline} money tableHref="/marketing/tenders" />
      </div>
      {charts.costByProject.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {charts.costByProject.map((project) => (
            <BarChartCard
              key={project.code}
              title={`Biaya per kategori · ${project.code}`}
              data={project.rows}
              money
              labelWidth={128}
              tableHref="/finance/pl"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
