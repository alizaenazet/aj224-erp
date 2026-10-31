"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ListChecksIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import { TermStatusBadge } from "@/components/projects/project-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/format";
import { deleteTerm, markTermReady, saveTerm } from "@/lib/projects/actions";
import {
  TERM_CONDITION_LABELS,
  TERM_CONDITIONS,
  TERM_KIND_LABELS,
  TERM_KINDS,
  describeCondition,
  type TermRow,
} from "@/lib/projects/labels";
import { termSchema, type TermInput } from "@/lib/projects/schema";

type TermsCardProps = {
  projectId: string;
  terms: TermRow[];
  contractValue: number | null;
  canManage: boolean;
  canMarkReady: boolean;
};

/** Payment-term schedule with the 100% check and manual Siap Ditagih (PRJ-03). */
export function TermsCard({ projectId, terms, contractValue, canManage, canMarkReady }: TermsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TermRow | null>(null);
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [confirm, setConfirm] = useState<{ term: TermRow; action: "delete" | "ready" } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const total = terms.reduce((sum, term) => sum + Number(term.amount_value ?? 0), 0);
  const totalPercent = contractValue ? Math.round((total / contractValue) * 10000) / 100 : null;
  const nextOrder = terms.reduce((max, term) => Math.max(max, term.sort_order), 0) + 1;
  const showActions = canManage || canMarkReady;

  async function runConfirmed() {
    if (!confirm) return;
    setPending(true);
    const result =
      confirm.action === "delete"
        ? await deleteTerm(confirm.term.id)
        : await markTermReady({ projectId, termId: confirm.term.id });
    setPending(false);
    setConfirmOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Termin pembayaran</CardTitle>
        <CardDescription>
          Termin berbasis persentase mengikuti nilai kontrak berlaku. Ditagih dan Lunas diisi otomatis dari faktur dan
          pembayaran.
        </CardDescription>
        {canManage ? (
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setDialogOpen(true);
              }}
            >
              <PlusIcon />
              Tambah termin
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {terms.length && totalPercent !== null && totalPercent !== 100 ? (
          <Alert variant="warning">
            <AlertTitle>Total termin {formatNumber(totalPercent, 2)}% dari nilai kontrak</AlertTitle>
            <AlertDescription>Periksa kembali jadwal termin agar totalnya 100% nilai kontrak berlaku.</AlertDescription>
          </Alert>
        ) : null}
        {terms.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListChecksIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada termin</EmptyTitle>
              <EmptyDescription>Uang muka, termin progres, dan retensi tampil di sini.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Porsi</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead>Syarat</TableHead>
                <TableHead>Status</TableHead>
                {showActions ? (
                  <TableHead>
                    <span className="sr-only">Tindakan</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => {
                const share = term.percent ?? (contractValue ? (Number(term.amount_value ?? 0) / contractValue) * 100 : null);
                const editable = canManage && (term.status === "not_due" || term.status === "ready");
                const deletable = canManage && term.status === "not_due";
                const readyable = canMarkReady && term.status === "not_due";
                return (
                  <TableRow key={term.id}>
                    <TableCell>{term.sort_order}</TableCell>
                    <TableCell className="max-w-64 min-w-32 whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{term.name}</span>
                        {term.notes ? <span className="text-xs text-muted-foreground">{term.notes}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell>{TERM_KIND_LABELS[term.kind]}</TableCell>
                    <TableCell className="text-right">
                      {share === null ? "—" : `${formatNumber(share, 2)}%`}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatRupiah(term.amount_value)}</TableCell>
                    <TableCell className="whitespace-nowrap">{describeCondition(term)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <TermStatusBadge status={term.status} />
                        {term.ready_at ? (
                          <span className="text-xs whitespace-nowrap text-muted-foreground">
                            {formatDateTime(term.ready_at)} · {term.ready_by_name ?? "Sistem"}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    {showActions ? (
                      <TableCell className="text-right">
                        {editable || deletable || readyable ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Tindakan untuk ${term.name}`}>
                                <MoreHorizontalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {readyable ? (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setConfirm({ term, action: "ready" });
                                    setConfirmOpen(true);
                                  }}
                                >
                                  Tandai Siap Ditagih
                                </DropdownMenuItem>
                              ) : null}
                              {editable ? (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditTarget(term);
                                    setDialogOpen(true);
                                  }}
                                >
                                  Ubah
                                </DropdownMenuItem>
                              ) : null}
                              {deletable ? (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => {
                                    setConfirm({ term, action: "delete" });
                                    setConfirmOpen(true);
                                  }}
                                >
                                  Hapus
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-medium">
                  {totalPercent === null ? "—" : `${formatNumber(totalPercent, 2)}%`}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">{formatRupiah(total)}</TableCell>
                <TableCell colSpan={showActions ? 3 : 2} />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>

      {canManage ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editTarget ? "Ubah termin" : "Tambah termin"}</DialogTitle>
              <DialogDescription>Isi persentase dari nilai kontrak atau nilai tetap, lalu syarat penagihannya.</DialogDescription>
            </DialogHeader>
            {dialogOpen ? (
              <TermForm
                projectId={projectId}
                term={editTarget}
                nextOrder={nextOrder}
                onDone={() => setDialogOpen(false)}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "delete" ? "Hapus termin?" : "Tandai Siap Ditagih?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "delete"
                ? `${confirm.term.name} dihapus dari jadwal termin.`
                : `${confirm?.term.name ?? ""} ditandai Siap Ditagih dan Finance menerima notifikasi. Status tidak bisa dikembalikan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm?.action === "delete" ? "destructive" : "default"}
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void runConfirmed();
              }}
            >
              {confirm?.action === "delete" ? "Hapus" : "Tandai Siap Ditagih"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function TermForm({
  projectId,
  term,
  nextOrder,
  onDone,
}: {
  projectId: string;
  term: TermRow | null;
  nextOrder: number;
  onDone: () => void;
}) {
  const form = useForm<TermInput>({
    resolver: zodResolver(termSchema) as unknown as Resolver<TermInput>,
    defaultValues: term
      ? {
          name: term.name,
          kind: term.kind,
          sort_order: term.sort_order,
          value_type: term.percent !== null ? "percent" : "amount",
          percent: term.percent,
          amount: term.amount,
          condition_type: term.condition_type,
          condition_progress: term.condition_progress,
          condition_date: term.condition_date,
          notes: term.notes,
        }
      : {
          name: "",
          kind: "progress",
          sort_order: nextOrder,
          value_type: "percent",
          percent: null,
          amount: null,
          condition_type: "progress",
          condition_progress: null,
          condition_date: null,
          notes: null,
        },
  });
  const valueType = useWatch({ control: form.control, name: "value_type" });
  const conditionType = useWatch({ control: form.control, name: "condition_type" });

  async function onSubmit(values: TermInput) {
    const result = await saveTerm({ projectId, termId: term?.id, values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  const percentInput = (name: "percent" | "condition_progress", label: string, id: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.01"
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>%</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="term-name">Nama termin *</FieldLabel>
              <Input
                id="term-name"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={80}
                placeholder="Mis. Termin 1"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="sort_order"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="term-order">Urutan *</FieldLabel>
              <Input
                id="term-order"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value === "" ? "" : Number(event.target.value))}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="kind"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="term-kind">Jenis *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="term-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {TERM_KIND_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="value_type"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="term-value-type">Dasar nilai *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="term-value-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Persentase nilai kontrak</SelectItem>
                  <SelectItem value="amount">Nilai tetap</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        {valueType === "percent" ? (
          percentInput("percent", "Persentase *", "term-percent")
        ) : (
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="term-amount">Nilai *</FieldLabel>
                <RupiahInput
                  id="term-amount"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        )}
        <Controller
          name="condition_type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="term-condition">Syarat penagihan *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="term-condition" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_CONDITIONS.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {TERM_CONDITION_LABELS[condition]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        {conditionType === "progress" ? percentInput("condition_progress", "Progres minimal *", "term-progress") : null}
        {conditionType === "date" ? (
          <Controller
            name="condition_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="term-date">Tanggal *</FieldLabel>
                <DatePicker id="term-date" value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ) : null}
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="term-notes">Catatan</FieldLabel>
              <Input
                id="term-notes"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={500}
                placeholder="Mis. setelah BAST ditandatangani"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
