"use client";

import { HistoryIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { AuditHistorySheet } from "@/components/audit/audit-history-sheet";
import { ToolForm } from "@/components/equipment/tool-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ToolRow } from "@/lib/equipment/labels";

type Option = { value: string; label: string };

/** Header actions on the tool page: edit (Operasional) and audit history (SA/Dir). */
export function ToolActions({
  tool,
  canManage,
  canViewHistory,
  options,
}: {
  tool: ToolRow;
  canManage: boolean;
  canViewHistory: boolean;
  options: { categories: Option[]; suppliers: Option[]; locations: Option[] };
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      {canViewHistory ? (
        <Button variant="outline" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon />
          Riwayat perubahan
        </Button>
      ) : null}
      {canManage ? (
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <PencilIcon />
          Ubah
        </Button>
      ) : null}
      <AuditHistorySheet
        target={historyOpen ? { table: "tools", recordId: tool.id, title: tool.name } : null}
        onOpenChange={setHistoryOpen}
      />
      {canManage ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ubah {tool.code}</DialogTitle>
              <DialogDescription>Kode dan tipe pelacakan tidak dapat diubah.</DialogDescription>
            </DialogHeader>
            {editOpen ? (
              <ToolForm
                toolId={tool.id}
                categories={options.categories}
                suppliers={options.suppliers}
                locations={options.locations}
                onDone={() => setEditOpen(false)}
                defaultValues={{
                  code: tool.code,
                  name: tool.name,
                  category_id: tool.category_id,
                  tracking: tool.tracking,
                  serial_no: tool.serial_no,
                  ownership: tool.ownership,
                  supplier_id: tool.supplier_id,
                  rental_rate: tool.rental_rate === null ? null : Number(tool.rental_rate),
                  rental_period: tool.rental_period,
                  notes: tool.notes,
                }}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
