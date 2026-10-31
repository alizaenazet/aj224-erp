"use client";

import { FileUpIcon, ListOrderedIcon, MoreHorizontalIcon, PlusIcon, WaypointsIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/data-table/export-button";
import { ProgressForm } from "@/components/progress/progress-form";
import { SectionForm } from "@/components/progress/section-form";
import { StageEditor } from "@/components/progress/stage-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import { deleteSection } from "@/lib/progress/actions";
import {
  PROGRESS_STATE_LABELS,
  PROGRESS_STATE_VARIANTS,
  formatProgress,
  progressState,
  type ProgressCells,
  type ProjectProgress,
  type SectionRow,
  type StageRow,
} from "@/lib/progress/labels";

type ProgressMatrixProps = {
  projectId: string;
  stages: StageRow[];
  sections: SectionRow[];
  cells: ProgressCells;
  summary: ProjectProgress | null;
  canManage: boolean;
};

type DialogState =
  | { kind: "section"; section: SectionRow | null }
  | { kind: "progress"; section: SectionRow }
  | { kind: "stages" }
  | null;

/** Matriks progres seksi × tahapan (PRJ-07) with section and progress editing (PRJ-05, PRJ-06). */
export function ProgressMatrix({ projectId, stages, sections, cells, summary, canManage }: ProgressMatrixProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [deleteTarget, setDeleteTarget] = useState<SectionRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const nextOrder = sections.reduce((max, section) => Math.max(max, section.sort_order), 0) + 10;

  function open(next: Exclude<DialogState, null>) {
    setDialog(next);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteSection({ projectId, sectionId: deleteTarget.id });
    setPending(false);
    setConfirmOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  const dialogTitle =
    dialog?.kind === "section"
      ? dialog.section
        ? `Ubah seksi ${dialog.section.code}`
        : "Tambah seksi"
      : dialog?.kind === "progress"
        ? `Perbarui progres ${dialog.section.code}`
        : "Atur tahapan proyek";
  const dialogDescription =
    dialog?.kind === "section"
      ? "kms dihitung otomatis dari panjang × jumlah sirkuit."
      : dialog?.kind === "progress"
        ? "Isi progres kumulatif tiap tahap (0–100%). Setiap perubahan tercatat di riwayat progres."
        : "Bobot mengikuti template tahapan; sesuaikan bila perlu. Total bobot harus 100.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriks progres</CardTitle>
        <CardDescription>
          Progres seksi = Σ(bobot × progres tahap) ÷ Σ bobot; progres proyek ditimbang dengan kms seksi.
        </CardDescription>
        <CardAction className="flex flex-wrap justify-end gap-2">
          <ExportButton exportKey="project-progress" params={{ project: projectId }} />
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <PlusIcon />
                  Kelola
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => open({ kind: "section", section: null })}>
                  <WaypointsIcon />
                  Tambah seksi
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => open({ kind: "stages" })}>
                  <ListOrderedIcon />
                  Atur tahapan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/import">
                    <FileUpIcon />
                    Impor seksi dari Excel
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WaypointsIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada seksi tarik</EmptyTitle>
              <EmptyDescription>
                {canManage
                  ? "Tambahkan seksi atau impor dari Excel untuk mulai mencatat progres."
                  : "Seksi tarik ditambahkan oleh Operasional."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seksi</TableHead>
                <TableHead>Tower</TableHead>
                <TableHead className="text-right">kms</TableHead>
                {stages.map((stage) => (
                  <TableHead key={stage.id} className="text-center whitespace-normal">
                    <div className="flex min-w-20 flex-col items-center">
                      <span>{stage.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">bobot {formatNumber(stage.weight, 2)}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead>Progres</TableHead>
                <TableHead className="text-right">Rencana</TableHead>
                {canManage ? (
                  <TableHead>
                    <span className="sr-only">Tindakan</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{section.code}</span>
                      <span className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(section.planned_start)} – {formatDate(section.planned_finish)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>
                        {section.tower_from} – {section.tower_to}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {section.tower_count === null ? "" : `${section.tower_count} tower · `}
                        {formatNumber(section.length_km, 3)} km × {section.circuits}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(section.kms, 3)}</TableCell>
                  {stages.map((stage) => {
                    const value = cells[section.id]?.[stage.id] ?? 0;
                    const state = progressState(value);
                    return (
                      <TableCell key={stage.id} className="text-center">
                        <Badge variant={PROGRESS_STATE_VARIANTS[state]} title={PROGRESS_STATE_LABELS[state]}>
                          {formatProgress(value, 0)}
                        </Badge>
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <div className="flex min-w-32 items-center gap-2">
                      <Progress value={section.progress} className="w-16" />
                      <span className="font-medium whitespace-nowrap tabular-nums">{formatProgress(section.progress)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatProgress(section.planned_progress)}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Tindakan untuk ${section.code}`}>
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => open({ kind: "progress", section })}>
                            Perbarui progres
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => open({ kind: "section", section })}>Ubah seksi</DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setDeleteTarget(section);
                              setConfirmOpen(true);
                            }}
                          >
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Total proyek
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNumber(summary?.total_kms ?? 0, 3)}
                </TableCell>
                <TableCell colSpan={stages.length} />
                <TableCell>
                  <div className="flex min-w-32 items-center gap-2">
                    <Progress value={summary?.progress ?? 0} className="w-16" />
                    <span className="font-medium whitespace-nowrap tabular-nums">{formatProgress(summary?.progress)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatProgress(summary?.planned_progress)}
                </TableCell>
                {canManage ? <TableCell /> : null}
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>

      {canManage ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className={dialog?.kind === "section" ? "sm:max-w-2xl" : "sm:max-w-xl"}>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
            {dialogOpen && dialog?.kind === "section" ? (
              <SectionForm
                projectId={projectId}
                section={dialog.section}
                nextOrder={nextOrder}
                onDone={() => setDialogOpen(false)}
              />
            ) : null}
            {dialogOpen && dialog?.kind === "progress" ? (
              <ProgressForm
                projectId={projectId}
                section={dialog.section}
                stages={stages}
                cells={cells[dialog.section.id] ?? {}}
                onDone={() => setDialogOpen(false)}
              />
            ) : null}
            {dialogOpen && dialog?.kind === "stages" ? (
              <StageEditor projectId={projectId} stages={stages} onDone={() => setDialogOpen(false)} />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus seksi {deleteTarget?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Seksi yang sudah memiliki progres tidak dapat dihapus. Progres proyek dihitung ulang tanpa seksi ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
