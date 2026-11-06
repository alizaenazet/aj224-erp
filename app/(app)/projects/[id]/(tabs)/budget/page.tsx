import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { BudgetEditor } from "@/components/projects/budget-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { formatNumber } from "@/lib/format";
import { BUDGET_MANAGE_ROLES, BUDGET_VIEW_ROLES, PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { getProject, projectBudgetLines, projectBudgetSummary } from "@/lib/projects/queries";
import { MoneyValue } from "@/components/app/money-value";

export const metadata: Metadata = { title: "RAB & Biaya" };

type Params = Promise<{ id: string }>;

export default function ProjectBudgetPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectBudget params={params} />
    </Suspense>
  );
}

/** RAB & Biaya tab (PRJ-04, PRD §11.3 Laba Rencana). */
async function ProjectBudget({ params }: { params: Params }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, BUDGET_VIEW_ROLES)) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const [lines, summary] = await Promise.all([projectBudgetLines(project.id), projectBudgetSummary(project.id)]);
  const contractValue = Number(summary?.contract_value ?? 0);
  const plannedProfit = summary?.planned_profit ?? null;
  const tiles = [
    { label: "Nilai kontrak", value: <MoneyValue value={summary?.contract_value ?? null} /> },
    { label: "Total RAB", value: <MoneyValue value={summary?.total_budget ?? 0} /> },
    { label: "Laba rencana", value: <MoneyValue value={plannedProfit} /> },
    {
      label: "Margin rencana",
      value: contractValue > 0 && plannedProfit !== null ? `${formatNumber((Number(plannedProfit) / contractValue) * 100, 1)}%` : "—",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader>
              <CardDescription>{tile.label}</CardDescription>
              <CardTitle className="text-lg tabular-nums sm:text-xl sm:whitespace-nowrap">{tile.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {lines.length ? (
        <BudgetEditor
          key={lines.map((line) => `${line.cost_category_id}:${line.budget}`).join("|")}
          projectId={project.id}
          lines={lines}
          canManage={hasAnyRole(profile.role, BUDGET_MANAGE_ROLES)}
        />
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Belum ada kategori biaya proyek aktif. Tambahkan di Master Data → Kategori Biaya.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
