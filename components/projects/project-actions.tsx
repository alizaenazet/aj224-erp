"use client";

import { ChevronDownIcon, HistoryIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AuditHistorySheet } from "@/components/audit/audit-history-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setProjectStatus } from "@/lib/projects/actions";
import {
  PROJECT_STATUS_LABELS,
  SETTABLE_STATUSES,
  type ProjectStatus,
} from "@/lib/projects/labels";

type ProjectActionsProps = {
  project: { id: string; name: string; status: ProjectStatus };
  canEdit: boolean;
  canSetStatus: boolean;
  canViewHistory: boolean;
};

/** Header actions on the project page: Riwayat, Ubah, status (PRJ-01). */
export function ProjectActions({ project, canEdit, canSetStatus, canViewHistory }: ProjectActionsProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function changeStatus(status: string) {
    if (status === project.status) return;
    setPending(true);
    const result = await setProjectStatus({ id: project.id, status });
    setPending(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <>
      {canViewHistory ? (
        <Button variant="outline" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon />
          Riwayat
        </Button>
      ) : null}
      {canEdit ? (
        <Button asChild variant="outline">
          <Link href={`/projects/${project.id}/edit`}>
            <PencilIcon />
            Ubah
          </Link>
        </Button>
      ) : null}
      {canSetStatus ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={pending}>
              Status: {PROJECT_STATUS_LABELS[project.status]}
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ubah status proyek</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={project.status} onValueChange={(value) => void changeStatus(value)}>
              {SETTABLE_STATUSES.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <AuditHistorySheet
        target={historyOpen ? { table: "projects", recordId: project.id, title: project.name } : null}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}
