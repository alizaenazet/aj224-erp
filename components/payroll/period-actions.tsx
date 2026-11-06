"use client";

import { CalculatorIcon, CheckIcon, PlusIcon, SendIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/actions";
import { approvePayroll, cancelPeriod, correctAttendance, createPeriod, generatePayroll, paySlips, returnPayroll, submitPayroll } from "@/lib/payroll/actions";
import { ATTENDANCE_STATUS_OPTIONS, GROUP_LABELS } from "@/lib/payroll/labels";

function useAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function act(call: () => Promise<ActionResult<unknown>>, onDone?: () => void) {
    setPending(true);
    const result = await call();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone?.();
    router.refresh();
  }
  return { pending, act };
}

/** PAY-01 */
export function NewPeriodButton() {
  const router = useRouter();
  const { pending, act } = useAction();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [group, setGroup] = useState("field");
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Periode baru
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Periode gaji baru</DialogTitle>
            <DialogDescription>Periode tidak boleh tumpang tindih untuk karyawan yang sama. Gunakan periode bulanan untuk staf bergaji bulanan.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="period-name">Nama *</FieldLabel>
              <Input id="period-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Mis. Lapangan 1–15 Nov 2026" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="period-start">Mulai *</FieldLabel>
                <DatePicker id="period-start" value={start} onChange={setStart} />
              </Field>
              <Field>
                <FieldLabel htmlFor="period-end">Selesai *</FieldLabel>
                <DatePicker id="period-end" value={end} onChange={setEnd} min={start ?? undefined} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="period-group">Kelompok *</FieldLabel>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger id="period-group" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                void act(
                  () => createPeriod({ name, period_start: start ?? "", period_end: end ?? "", group_kind: group as "field" }),
                  () => {
                    setOpen(false);
                    router.refresh();
                  },
                )
              }
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Role-specific period actions (PAY-02, PAY-04, PAY-06). */
export function PeriodActions({
  periodId,
  status,
  role,
  today,
}: {
  periodId: string;
  status: string;
  role: string;
  today: string;
}) {
  const { pending, act } = useAction();
  const [payOpen, setPayOpen] = useState(false);
  const [payDate, setPayDate] = useState<string | null>(today);
  const [method, setMethod] = useState<"transfer" | "cash">("transfer");
  const editable = status === "draft" || status === "returned";
  return (
    <>
      {role === "hcm" && editable ? (
        <>
          <Button variant="outline" disabled={pending} onClick={() => void act(() => generatePayroll({ id: periodId }))}>
            <CalculatorIcon />
            Hitung ulang
          </Button>
          <Button disabled={pending} onClick={() => void act(() => submitPayroll({ id: periodId }))}>
            <SendIcon />
            Ajukan
          </Button>
          <ReasonDialogButton
            label="Batalkan"
            variant="outline"
            title="Batalkan periode?"
            description="Slip periode ini dihapus; periode tetap terlihat dengan tanda Batal."
            confirmLabel="Batalkan periode"
            action={(reason) => cancelPeriod({ id: periodId, reason })}
          />
        </>
      ) : null}
      {role === "director" && status === "submitted" ? (
        <>
          <ReasonDialogButton
            label="Kembalikan"
            icon={<Undo2Icon />}
            variant="outline"
            title="Kembalikan ke HCM?"
            description="HCM menerima catatan dan dapat memperbaiki lalu mengajukan ulang."
            confirmLabel="Kembalikan"
            reasonLabel="Catatan"
            action={(note) => returnPayroll({ id: periodId, note })}
          />
          <Button disabled={pending} onClick={() => void act(() => approvePayroll({ id: periodId }))}>
            <CheckIcon />
            Setujui
          </Button>
        </>
      ) : null}
      {role === "finance" && status === "approved" ? (
        <>
          <Button onClick={() => setPayOpen(true)}>Tandai semua dibayar</Button>
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pembayaran gaji</DialogTitle>
                <DialogDescription>Semua slip yang belum dibayar ditandai dibayar. Gaji tunai lewat kas lapangan dicatat juga sebagai pengeluaran kas lapangan jenis Pembayaran Gaji.</DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="pay-date">Tanggal bayar</FieldLabel>
                  <DatePicker id="pay-date" value={payDate} onChange={setPayDate} max={today} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="pay-method">Metode</FieldLabel>
                  <Select value={method} onValueChange={(value) => setMethod(value as "transfer" | "cash")}>
                    <SelectTrigger id="pay-method" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="cash">Tunai</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayOpen(false)}>
                  Batal
                </Button>
                <Button
                  disabled={pending}
                  onClick={() => void act(() => paySlips({ periodId, slips: null, date: payDate ?? today, method }), () => setPayOpen(false))}
                >
                  Tandai dibayar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </>
  );
}

/** HCM-11: audited correction of a locked day. */
export function CorrectionButton({ employees, today }: { employees: ComboboxOption[]; today: string }) {
  const { pending, act } = useAction();
  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [status, setStatus] = useState("present");
  const [overtime, setOvertime] = useState("0");
  const [reason, setReason] = useState("");
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Koreksi absensi terkunci
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Koreksi absensi terkunci</DialogTitle>
            <DialogDescription>Untuk hari di periode yang sudah disetujui atau dibayar. Tercatat di log audit; selisih upah dibayarkan sebagai koreksi di payroll berikutnya.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="corr-employee">Karyawan *</FieldLabel>
              <Combobox id="corr-employee" value={employee} onChange={setEmployee} options={employees} placeholder="Pilih karyawan" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="corr-date">Tanggal *</FieldLabel>
                <DatePicker id="corr-date" value={date} onChange={setDate} max={today} />
              </Field>
              <Field>
                <FieldLabel htmlFor="corr-status">Status baru</FieldLabel>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="corr-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="corr-ot">Lembur (jam)</FieldLabel>
                <Input id="corr-ot" type="number" min={0} max={24} step="0.5" value={overtime} onChange={(event) => setOvertime(event.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="corr-reason">Alasan *</FieldLabel>
              <Input id="corr-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={pending || !employee || !date}
              onClick={() =>
                void act(
                  () => correctAttendance({ employeeId: employee, date: date ?? "", status, overtime: status === "present" ? Number(overtime) || 0 : 0, reason }),
                  () => setOpen(false),
                )
              }
            >
              Simpan koreksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
