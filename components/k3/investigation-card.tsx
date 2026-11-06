"use client";

import { CheckIcon, LockIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { cancelIncident, closeIncident, completeAction, saveAction, saveInvestigation } from "@/lib/k3/actions";
import { ROOT_CAUSE_LABELS, ROOT_CAUSES, type IncidentAction, type RootCause } from "@/lib/k3/labels";

/** Investigasi (K3-03): Operasional edits while the incident is open. */
export function InvestigationCard({
  incidentId,
  directCause,
  rootCause,
  lostDays,
  canEdit,
}: {
  incidentId: string;
  directCause: string | null;
  rootCause: RootCause | null;
  lostDays: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [cause, setCause] = useState(directCause ?? "");
  const [root, setRoot] = useState<RootCause | "">(rootCause ?? "");
  const [days, setDays] = useState(String(lostDays));
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const result = await saveInvestigation({
      id: incidentId,
      values: { direct_cause: cause, root_cause: root as RootCause, lost_days: Number(days) || 0 },
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setEditing(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investigasi</CardTitle>
        <CardDescription>Penyebab langsung, akar masalah dan hari kerja hilang.</CardDescription>
        {canEdit && !editing ? (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <PencilIcon />
              {rootCause ? "Ubah" : "Isi investigasi"}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex flex-col gap-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="inv-cause">Penyebab langsung</FieldLabel>
                <Textarea id="inv-cause" value={cause} onChange={(event) => setCause(event.target.value)} maxLength={1000} />
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-root">Akar masalah *</FieldLabel>
                <Select value={root} onValueChange={(value) => setRoot(value as RootCause)}>
                  <SelectTrigger id="inv-root" className="w-full">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOT_CAUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {ROOT_CAUSE_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-days">Hari kerja hilang</FieldLabel>
                <Input id="inv-days" type="number" inputMode="numeric" min={0} value={days} onChange={(event) => setDays(event.target.value)} />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button onClick={() => void submit()} disabled={pending || !root}>
                {pending ? "Menyimpan…" : "Simpan investigasi"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Batal
              </Button>
            </div>
          </div>
        ) : rootCause ? (
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-1 sm:col-span-3">
              <dt className="text-muted-foreground">Penyebab langsung</dt>
              <dd className="whitespace-pre-line">{directCause ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Akar masalah</dt>
              <dd>{ROOT_CAUSE_LABELS[rootCause]}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Hari kerja hilang</dt>
              <dd>{lostDays}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Belum diinvestigasi.</p>
        )}
      </CardContent>
    </Card>
  );
}

type ActionDraft = { id: string | null; description: string; pic: string; due: string | null };

/** Tindakan perbaikan (K3-04) with add/edit Dialog and Selesai. */
export function ActionsCard({
  incidentId,
  actions,
  employees,
  canEdit,
  evidence,
}: {
  incidentId: string;
  actions: IncidentAction[];
  employees: ComboboxOption[];
  canEdit: boolean;
  /** Rendered under each action (its evidence attachments). */
  evidence?: Record<string, React.ReactNode>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!draft) return;
    setPending(true);
    const result = await saveAction({
      incidentId,
      actionId: draft.id,
      values: { description: draft.description, pic_employee_id: draft.pic, due_date: draft.due ?? "" },
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setDraft(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tindakan perbaikan</CardTitle>
        <CardDescription>Insiden hanya dapat ditutup bila semua tindakan Selesai.</CardDescription>
        {canEdit ? (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setDraft({ id: null, description: "", pic: "", due: null })}>
              <PlusIcon />
              Tindakan
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {actions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uraian</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Tenggat</TableHead>
                <TableHead>Status</TableHead>
                {canEdit ? <TableHead className="text-right">Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="max-w-96 whitespace-normal">
                    {action.description}
                    {action.done_note ? <div className="text-xs text-muted-foreground">{action.done_note}</div> : null}
                    {evidence?.[action.id]}
                  </TableCell>
                  <TableCell className="whitespace-normal">{action.pic_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(action.due_date)}</TableCell>
                  <TableCell>
                    {action.status === "done" ? (
                      <Badge variant="success">Selesai</Badge>
                    ) : action.overdue ? (
                      <Badge variant="destructive">Terlambat</Badge>
                    ) : (
                      <Badge variant="warning">Terbuka</Badge>
                    )}
                  </TableCell>
                  {canEdit ? (
                    <TableCell className="text-right">
                      {action.status === "open" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDraft({ id: action.id, description: action.description, pic: action.pic_employee_id, due: action.due_date })}
                          >
                            Ubah
                          </Button>
                          <ReasonDialogButton
                            label="Selesai"
                            icon={<CheckIcon />}
                            variant="outline"
                            title="Tandai tindakan Selesai?"
                            description="Tambahkan catatan hasil bila perlu; lampirkan bukti di bawah uraian."
                            confirmLabel="Tandai Selesai"
                            reasonLabel="Catatan hasil"
                            optional
                            action={(note) => completeAction({ id: action.id, note })}
                          />
                        </div>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada tindakan perbaikan.</p>
        )}
      </CardContent>
      <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : setDraft(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Ubah tindakan" : "Tambah tindakan perbaikan"}</DialogTitle>
            <DialogDescription>PIC dari data karyawan; tenggat menentukan status terlambat.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="action-description">Uraian *</FieldLabel>
                <Textarea
                  id="action-description"
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  maxLength={500}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="action-pic">PIC *</FieldLabel>
                <Combobox
                  id="action-pic"
                  value={draft.pic}
                  onChange={(value) => setDraft({ ...draft, pic: value })}
                  options={employees}
                  placeholder="Pilih karyawan"
                  searchPlaceholder="Cari nama"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="action-due">Tenggat *</FieldLabel>
                <DatePicker id="action-due" value={draft.due} onChange={(value) => setDraft({ ...draft, due: value })} />
              </Field>
            </FieldGroup>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={() => void submit()} disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Close (K3-03/K3-04) and cancel (UMM-11). */
export function IncidentStatusActions({ incidentId, canClose }: { incidentId: string; canClose: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function close() {
    setPending(true);
    const result = await closeIncident({ id: incidentId });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <>
      {canClose ? (
        <Button onClick={() => void close()} disabled={pending}>
          <LockIcon />
          {pending ? "Menutup…" : "Tutup insiden"}
        </Button>
      ) : null}
      <ReasonDialogButton
        label="Batalkan"
        title="Batalkan insiden?"
        description="Insiden tetap terlihat dengan tanda Batal dan tidak dihitung di ringkasan K3."
        confirmLabel="Batalkan insiden"
        action={(reason) => cancelIncident({ id: incidentId, reason })}
      />
    </>
  );
}
