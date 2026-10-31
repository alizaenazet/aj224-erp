import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { TermStatusBadge } from "@/components/projects/project-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { MARKETING_VIEW_ROLES } from "@/lib/clients/labels";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { PROGRESS_VIEW_ROLES, formatDeviation, formatProgress } from "@/lib/progress/labels";
import {
  BUDGET_VIEW_ROLES,
  CONTRACT_VIEW_ROLES,
  PROJECT_VIEW_ROLES,
  TERM_STATUSES,
} from "@/lib/projects/labels";
import { getProject, projectBudgetSummary, projectTerms } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Ringkasan Proyek" };

type Params = Promise<{ id: string }>;

export default function ProjectSummaryPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectSummary params={params} />
    </Suspense>
  );
}

type Row = { key: string; label: React.ReactNode; value: React.ReactNode };

function DataList({ rows }: { rows: Row[] }) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      {rows.map(({ key, label, value }) => (
        <div key={key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="ml-auto text-right font-medium whitespace-nowrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Ringkasan tab (PRJ-09); costs, team and incidents join as their modules land. */
async function ProjectSummary({ params }: { params: Params }) {
  const profile = await requireProfile();
  // The layout already shows the access message.
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const showContract = hasAnyRole(profile.role, CONTRACT_VIEW_ROLES);
  const showBudget = hasAnyRole(profile.role, BUDGET_VIEW_ROLES);
  const showProgress = hasAnyRole(profile.role, PROGRESS_VIEW_ROLES);
  const [terms, budget] = await Promise.all([
    showContract ? projectTerms(project.id) : Promise.resolve([]),
    showBudget ? projectBudgetSummary(project.id) : Promise.resolve(null),
  ]);
  const canOpenMarketing = hasAnyRole(profile.role, MARKETING_VIEW_ROLES);

  const data: [string, React.ReactNode][] = [
    [
      "Klien",
      canOpenMarketing && project.client_name ? (
        <Link href={`/marketing/clients/${project.client_id}`} className="underline-offset-4 hover:underline">
          {project.client_name}
        </Link>
      ) : (
        (project.client_name ?? "—")
      ),
    ],
    ["Pemilik akhir", project.end_owner ?? "—"],
    ["Lokasi pekerjaan", project.site ?? "—"],
    ["Tegangan", project.voltage_kv ? `${project.voltage_kv} kV` : "—"],
    ["Panjang", project.length_kms === null ? "—" : `${formatNumber(project.length_kms, 2)} kms`],
    ["Jumlah tower", project.tower_count === null ? "—" : formatNumber(project.tower_count)],
    ["Tanggal mulai", formatDate(project.start_date)],
    ["Target selesai", formatDate(project.finish_date)],
    [
      "Asal",
      project.tender_id ? (
        canOpenMarketing ? (
          <Link href={`/marketing/tenders/${project.tender_id}`} className="underline-offset-4 hover:underline">
            Tender
          </Link>
        ) : (
          "Tender"
        )
      ) : (
        "Penunjukan langsung"
      ),
    ],
    ["Catatan", project.notes ?? "—"],
  ];

  const termTotal = terms.reduce((sum, term) => sum + Number(term.amount_value ?? 0), 0);
  const termsByStatus = TERM_STATUSES.map((status) => {
    const rows = terms.filter((term) => term.status === status);
    return { status, count: rows.length, amount: rows.reduce((sum, term) => sum + Number(term.amount_value ?? 0), 0) };
  });
  const plannedMargin =
    budget && Number(budget.contract_value) > 0
      ? (Number(budget.planned_profit) / Number(budget.contract_value)) * 100
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Data proyek</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {data.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        {showProgress ? (
          <Card>
            <CardHeader>
              <CardTitle>Progres</CardTitle>
              <CardDescription>
                {project.progress === null
                  ? "Belum ada seksi tarik."
                  : "Progres proyek ditimbang kms seksi; rencana dari jadwal seksi."}
              </CardDescription>
            </CardHeader>
            {project.progress === null ? null : (
              <CardContent className="flex flex-col gap-3">
                <Progress value={Number(project.progress)} />
                <DataList
                  rows={[
                    { key: "actual", label: "Aktual", value: formatProgress(project.progress) },
                    { key: "planned", label: "Rencana hari ini", value: formatProgress(project.planned_progress) },
                    {
                      key: "deviation",
                      label: "Deviasi",
                      value: formatDeviation(Number(project.progress) - Number(project.planned_progress ?? 0)),
                    },
                  ]}
                />
              </CardContent>
            )}
          </Card>
        ) : null}
        {showContract ? (
          <Card>
            <CardHeader>
              <CardTitle>Kontrak</CardTitle>
              <CardDescription>Nilai sebelum PPN, mengikuti addendum terakhir.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                rows={[
                  { key: "value", label: "Nilai kontrak", value: formatRupiah(project.contract_value) },
                  {
                    key: "ppn",
                    label: "PPN",
                    value: project.ppn_applicable === null ? "—" : project.ppn_applicable ? "Dikenakan" : "Tidak dikenakan",
                  },
                  { key: "addenda", label: "Addendum", value: formatNumber(project.addendum_count) },
                ]}
              />
            </CardContent>
          </Card>
        ) : null}
        {showContract ? (
          <Card>
            <CardHeader>
              <CardTitle>Termin</CardTitle>
              <CardDescription>
                {terms.length ? `${terms.length} termin, total ${formatRupiah(termTotal)}.` : "Jadwal termin belum diisi."}
              </CardDescription>
            </CardHeader>
            {terms.length ? (
              <CardContent>
                <DataList
                  rows={termsByStatus.map(({ status, count, amount }) => ({
                    key: status,
                    label: (
                      <span className="flex items-center gap-2">
                        <TermStatusBadge status={status} />
                        <span className="whitespace-nowrap">{count} termin</span>
                      </span>
                    ),
                    value: formatRupiah(amount),
                  }))}
                />
              </CardContent>
            ) : null}
          </Card>
        ) : null}
        {showBudget ? (
          <Card>
            <CardHeader>
              <CardTitle>RAB</CardTitle>
              <CardDescription>Laba rencana = nilai kontrak − total RAB.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                rows={[
                  { key: "budget", label: "Total RAB", value: formatRupiah(budget?.total_budget ?? 0) },
                  { key: "profit", label: "Laba rencana", value: formatRupiah(budget?.planned_profit ?? null) },
                  {
                    key: "margin",
                    label: "Margin rencana",
                    value: plannedMargin === null ? "—" : `${formatNumber(plannedMargin, 1)}%`,
                  },
                ]}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
