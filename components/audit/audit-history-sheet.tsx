"use client";

import { useEffect, useState } from "react";
import { AuditChanges } from "@/components/audit/audit-changes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecordHistory } from "@/lib/audit/actions";
import { auditActionLabel, type AuditEntry } from "@/lib/audit/labels";
import { formatDateTime } from "@/lib/format";

type AuditHistorySheetProps = {
  /** Record to show; null closes the sheet. */
  target: { table: string; recordId: string; title: string } | null;
  onOpenChange: (open: boolean) => void;
};

/** Change history of one record (UMM-08), for Super Admin and Direktur. */
export function AuditHistorySheet({ target, onOpenChange }: AuditHistorySheetProps) {
  return (
    <Sheet open={target !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Riwayat perubahan</SheetTitle>
          <SheetDescription>{target?.title}</SheetDescription>
        </SheetHeader>
        {target ? (
          <HistoryList key={`${target.table}:${target.recordId}`} {...target} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function HistoryList({ table, recordId }: { table: string; recordId: string }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getRecordHistory({ table, recordId }).then((result) => {
      if (!active) return;
      if (result.ok) setEntries(result.data ?? []);
      else setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [table, recordId]);

  if (error) {
    return (
      <div className="px-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!entries) {
    return (
      <div className="flex flex-col gap-3 px-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="px-4 text-sm text-muted-foreground">Belum ada riwayat perubahan.</p>;
  }

  return (
    <ScrollArea className="min-h-0 flex-1 px-4">
      <div className="flex flex-col gap-3 pb-4 text-sm">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex flex-col gap-2">
            {index > 0 ? <Separator /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{auditActionLabel(entry.action)}</Badge>
              <span className="text-muted-foreground">
                {formatDateTime(entry.created_at)} · {entry.actor_name ?? "Sistem"}
              </span>
            </div>
            <AuditChanges entry={entry} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
