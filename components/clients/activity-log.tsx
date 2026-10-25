"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheckIcon, MessageSquareTextIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { deleteActivity, saveActivity, setFollowUpDone } from "@/lib/clients/actions";
import { ACTIVITY_KIND_LABELS, type ActivityRow } from "@/lib/clients/labels";
import { activitySchema, type ActivityInput } from "@/lib/clients/schema";
import { formatDate } from "@/lib/format";

const NO_TENDER = "none";

/** Follow-up state relative to today (WIB). */
export function followUpState(activity: Pick<ActivityRow, "follow_up_date" | "follow_up_done_at">, today: string) {
  if (!activity.follow_up_date) return null;
  if (activity.follow_up_done_at) return "done" as const;
  if (activity.follow_up_date < today) return "overdue" as const;
  if (activity.follow_up_date === today) return "due" as const;
  return "upcoming" as const;
}

export const FOLLOW_UP_BADGES: Record<
  NonNullable<ReturnType<typeof followUpState>>,
  { label: string; variant: "secondary" | "default" | "destructive" | "outline" }
> = {
  done: { label: "Selesai", variant: "secondary" },
  overdue: { label: "Terlambat", variant: "destructive" },
  due: { label: "Jatuh tempo", variant: "default" },
  upcoming: { label: "Terjadwal", variant: "outline" },
};

type ActivityLogProps = {
  clientId: string;
  activities: ActivityRow[];
  /** Tenders of the client that an activity may refer to. */
  tenders: { value: string; label: string }[];
  /** Preselected tender (on a tender page). */
  tenderId?: string;
  today: string;
  canLog: boolean;
  currentUserId: string;
  isSuperAdmin: boolean;
  description?: string;
};

/** Visits, calls and meetings with follow-ups (MKT-02). */
export function ActivityLog({
  clientId,
  activities,
  tenders,
  tenderId,
  today,
  canLog,
  currentUserId,
  isSuperAdmin,
  description = "Kunjungan, telepon, dan meeting beserta tindak lanjutnya.",
}: ActivityLogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActivityRow | null>(null);
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [deleteTarget, setDeleteTarget] = useState<ActivityRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const canEdit = (activity: ActivityRow) =>
    canLog && (isSuperAdmin || activity.owner_id === currentUserId);

  async function toggleDone(activity: ActivityRow) {
    setPending(true);
    const result = await setFollowUpDone({ activityId: activity.id, done: !activity.follow_up_done_at });
    setPending(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteActivity(deleteTarget.id);
    setPending(false);
    setConfirmOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas</CardTitle>
        <CardDescription>{description}</CardDescription>
        {canLog ? (
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setDialogOpen(true);
              }}
            >
              <PlusIcon />
              Catat aktivitas
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareTextIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada aktivitas</EmptyTitle>
              <EmptyDescription>Catat kunjungan, telepon, atau meeting dengan klien.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="flex flex-col gap-4">
            {activities.map((activity, index) => {
              const state = followUpState(activity, today);
              return (
                <li key={activity.id} className="flex flex-col gap-2">
                  {index > 0 ? <Separator /> : null}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">{ACTIVITY_KIND_LABELS[activity.kind]}</Badge>
                      <span className="font-medium">{formatDate(activity.activity_date)}</span>
                      <span className="text-muted-foreground">· {activity.owner_name ?? "Sistem"}</span>
                    </div>
                    {canEdit(activity) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Tindakan aktivitas">
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditTarget(activity);
                              setDialogOpen(true);
                            }}
                          >
                            Ubah
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setDeleteTarget(activity);
                              setConfirmOpen(true);
                            }}
                          >
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                  <p className="text-sm whitespace-pre-line">{activity.notes}</p>
                  {activity.tender_id && !tenderId ? (
                    <Link
                      href={`/marketing/tenders/${activity.tender_id}`}
                      className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Tender: {activity.tender_name}
                    </Link>
                  ) : null}
                  {state ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <CalendarCheckIcon className="size-4 text-muted-foreground" />
                      <span>Tindak lanjut {formatDate(activity.follow_up_date)}</span>
                      <Badge variant={FOLLOW_UP_BADGES[state].variant}>{FOLLOW_UP_BADGES[state].label}</Badge>
                      {canEdit(activity) ? (
                        <Button variant="link" size="sm" disabled={pending} onClick={() => void toggleDone(activity)}>
                          {activity.follow_up_done_at ? "Buka kembali" : "Tandai selesai"}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>

      {canLog ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTarget ? "Ubah aktivitas" : "Catat aktivitas"}</DialogTitle>
              <DialogDescription>Isi tanggal tindak lanjut bila perlu dihubungi lagi.</DialogDescription>
            </DialogHeader>
            {dialogOpen ? (
              <ActivityForm
                clientId={clientId}
                activity={editTarget}
                tenders={tenders}
                tenderId={tenderId}
                today={today}
                onDone={() => setDialogOpen(false)}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus aktivitas?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${ACTIVITY_KIND_LABELS[deleteTarget.kind]} ${formatDate(deleteTarget.activity_date)} dihapus beserta tindak lanjutnya.`
                : null}
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

function ActivityForm({
  clientId,
  activity,
  tenders,
  tenderId,
  today,
  onDone,
}: {
  clientId: string;
  activity: ActivityRow | null;
  tenders: { value: string; label: string }[];
  tenderId?: string;
  today: string;
  onDone: () => void;
}) {
  const form = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema) as unknown as Resolver<ActivityInput>,
    defaultValues: activity
      ? {
          activity_date: activity.activity_date,
          kind: activity.kind,
          notes: activity.notes,
          tender_id: activity.tender_id,
          follow_up_date: activity.follow_up_date,
        }
      : { activity_date: today, tender_id: tenderId ?? null, follow_up_date: null },
  });

  async function onSubmit(values: ActivityInput) {
    const result = await saveActivity({ clientId, activityId: activity?.id, values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="kind"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="activity-kind">Jenis *</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="activity-kind" aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="activity_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="activity-date">Tanggal *</FieldLabel>
              <DatePicker
                id="activity-date"
                value={field.value}
                onChange={(value) => field.onChange(value ?? undefined)}
                max={today}
                invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="activity-notes">Catatan *</FieldLabel>
              <Textarea
                id="activity-notes"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={1000}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        {tenders.length ? (
          <Controller
            name="tender_id"
            control={form.control}
            render={({ field }) => (
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="activity-tender">Tender terkait</FieldLabel>
                <Select
                  value={field.value ?? NO_TENDER}
                  onValueChange={(value) => field.onChange(value === NO_TENDER ? null : value)}
                >
                  <SelectTrigger id="activity-tender" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TENDER}>Tidak terkait tender</SelectItem>
                    {tenders.map((tender) => (
                      <SelectItem key={tender.value} value={tender.value}>
                        {tender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        ) : null}
        <Controller
          name="follow_up_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="activity-follow-up">Tanggal tindak lanjut</FieldLabel>
              <DatePicker
                id="activity-follow-up"
                value={field.value}
                onChange={field.onChange}
                clearable
                placeholder="Tidak ada"
                invalid={fieldState.invalid}
              />
              <FieldDescription>Pengingat dikirim pada tanggal ini.</FieldDescription>
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
