"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/format";
import { saveBudget } from "@/lib/projects/actions";
import { usageBand, type BudgetLine } from "@/lib/projects/labels";

const BAND_VARIANTS = { normal: "secondary", warning: "warning", over: "destructive" } as const;

type Draft = { amount: number | null; notes: string };

function UsageBadge({ budget, actual }: { budget: number; actual: number }) {
  const band = usageBand(budget, actual);
  const label = budget > 0 ? `${formatNumber((actual / budget) * 100, 1)}%` : actual > 0 ? "Tanpa anggaran" : "0%";
  return <Badge variant={BAND_VARIANTS[band]}>{label}</Badge>;
}

/** RAB vs realization per cost category (PRJ-04); editable by Finance and Operasional. */
export function BudgetEditor({
  projectId,
  lines,
  canManage,
}: {
  projectId: string;
  lines: BudgetLine[];
  canManage: boolean;
}) {
  const initial = () =>
    Object.fromEntries(
      lines.map((line) => [line.cost_category_id, { amount: line.budget || null, notes: line.notes ?? "" }]),
    ) as Record<string, Draft>;
  const [drafts, setDrafts] = useState<Record<string, Draft>>(initial);
  const [saving, setSaving] = useState(false);

  const budgetOf = (line: BudgetLine) => (canManage ? (drafts[line.cost_category_id]?.amount ?? 0) : line.budget);
  const totalBudget = lines.reduce((sum, line) => sum + budgetOf(line), 0);
  const totalActual = lines.reduce((sum, line) => sum + line.actual, 0);
  const dirty = lines.some((line) => {
    const draft = drafts[line.cost_category_id];
    return (draft.amount ?? 0) !== line.budget || draft.notes !== (line.notes ?? "");
  });

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function save() {
    setSaving(true);
    const result = await saveBudget({
      projectId,
      lines: lines.map((line) => ({
        cost_category_id: line.cost_category_id,
        amount: drafts[line.cost_category_id].amount,
        notes: drafts[line.cost_category_id].notes.trim() || null,
      })),
    });
    setSaving(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RAB per kategori biaya</CardTitle>
        <CardDescription>
          Realisasi diambil dari biaya proyek di modul keuangan. % Terpakai kuning mulai 80%, merah di atas 100%.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead className={canManage ? "min-w-48" : "text-right"}>Anggaran</TableHead>
              <TableHead className="text-right">Realisasi</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
              <TableHead>% Terpakai</TableHead>
              <TableHead className={canManage ? "min-w-48" : undefined}>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const budget = budgetOf(line);
              const draft = drafts[line.cost_category_id];
              return (
                <TableRow key={line.cost_category_id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col">
                      <span className="font-medium">{line.name}</span>
                      <span className="text-xs text-muted-foreground">{line.code}</span>
                    </div>
                  </TableCell>
                  <TableCell className={canManage ? undefined : "text-right whitespace-nowrap"}>
                    {canManage ? (
                      <RupiahInput
                        value={draft.amount}
                        onChange={(amount) => update(line.cost_category_id, { amount })}
                      />
                    ) : (
                      formatRupiah(line.budget)
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatRupiah(line.actual)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatRupiah(budget - line.actual)}</TableCell>
                  <TableCell>
                    <UsageBadge budget={budget} actual={line.actual} />
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    {canManage ? (
                      <Input
                        value={draft.notes}
                        onChange={(event) => update(line.cost_category_id, { notes: event.target.value })}
                        maxLength={300}
                        aria-label={`Catatan ${line.name}`}
                      />
                    ) : (
                      (line.notes ?? "—")
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className={canManage ? "font-medium whitespace-nowrap" : "text-right font-medium whitespace-nowrap"}>
                {formatRupiah(totalBudget)}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">{formatRupiah(totalActual)}</TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {formatRupiah(totalBudget - totalActual)}
              </TableCell>
              <TableCell>
                <UsageBadge budget={totalBudget} actual={totalActual} />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Button onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? "Menyimpan…" : "Simpan RAB"}
            </Button>
            <Button variant="outline" onClick={() => setDrafts(initial())} disabled={saving || !dirty}>
              Batalkan perubahan
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
