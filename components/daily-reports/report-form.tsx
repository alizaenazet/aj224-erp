"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveDailyReport } from "@/lib/daily-reports/actions";
import { OBSTACLE_CATEGORIES, OBSTACLE_LABELS, WEATHERS, WEATHER_LABELS } from "@/lib/daily-reports/labels";
import { dailyReportSchema, type DailyReportInput } from "@/lib/daily-reports/schema";
import { formatNumber } from "@/lib/format";

type Option = { value: string; label: string };

type ReportFormProps = {
  projectId: string;
  reportDate: string;
  defaultValues?: Partial<DailyReportInput>;
  /** Server copy exists (edit): a local draft is offered, not applied silently. */
  editing: boolean;
  sections: Option[];
  stages: Option[];
  /** Current progress by `section|stage`. */
  current: Record<string, number>;
  /** Crew marked Hadir in that day's attendance. */
  workforce: number;
  cancelHref: string;
};

const draftKey = (projectId: string, date: string) => `daily-report:${projectId}:${date}`;

function readDraft(key: string): DailyReportInput | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DailyReportInput) : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, values: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Storage full or blocked: the form still works without a draft.
  }
}

function clearDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}

/** Laporan harian (OPS-01) with a local draft on the device (UMM-12). */
export function ReportForm({
  projectId,
  reportDate,
  defaultValues,
  editing,
  sections,
  stages,
  current,
  workforce,
  cancelHref,
}: ReportFormProps) {
  const router = useRouter();
  const key = draftKey(projectId, reportDate);
  const form = useForm<DailyReportInput>({
    resolver: zodResolver(dailyReportSchema) as unknown as Resolver<DailyReportInput>,
    defaultValues: {
      project_id: projectId,
      report_date: reportDate,
      no_activity: false,
      no_activity_reason: null,
      weather_morning: null,
      weather_midday: null,
      weather_afternoon: null,
      effective_hours: null,
      safety_briefing: false,
      briefing_participants: null,
      equipment_used: null,
      plan_tomorrow: null,
      notes: null,
      activities: [],
      obstacles: [],
      ...defaultValues,
    },
  });
  const activities = useFieldArray({ control: form.control, name: "activities" });
  const obstacles = useFieldArray({ control: form.control, name: "obstacles" });
  const [noActivity, briefing, activityValues] = useWatch({
    control: form.control,
    name: ["no_activity", "safety_briefing", "activities"],
  });
  const [pendingDraft, setPendingDraft] = useState<DailyReportInput | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const restored = useRef(false);

  // Restore a draft once; an edit only offers it.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = readDraft(key);
    if (!draft) return;
    if (editing) {
      setPendingDraft(draft);
    } else {
      form.reset({ ...draft, project_id: projectId, report_date: reportDate });
      toast.info("Draf laporan di perangkat ini dipulihkan.");
    }
  }, [editing, form, key, projectId, reportDate]);

  // Keep the draft up to date while typing.
  useEffect(() => {
    const subscription = form.watch((values) => {
      writeDraft(key, values);
      setDraftSaved(true);
    });
    return () => subscription.unsubscribe();
  }, [form, key]);

  async function onSubmit(values: DailyReportInput) {
    const result = await saveDailyReport(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    clearDraft(key);
    toast.success(result.message);
    router.push(`/operations/daily-reports/${result.data?.id}#foto`);
  }

  const select = (
    name: "weather_morning" | "weather_midday" | "weather_afternoon",
    label: string,
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={`report-${name}`}>{label}</FieldLabel>
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id={`report-${name}`} className="w-full">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {WEATHERS.map((weather) => (
                <SelectItem key={weather} value={weather}>
                  {WEATHER_LABELS[weather]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    />
  );

  const textarea = (name: "equipment_used" | "plan_tomorrow" | "notes", label: string, placeholder?: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`report-${name}`}>{label}</FieldLabel>
          <Textarea
            id={`report-${name}`}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={name === "notes" ? 1000 : 500}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  const activitiesError = form.formState.errors.activities?.root?.message ?? form.formState.errors.activities?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {pendingDraft ? (
        <Alert>
          <AlertDescription className="flex flex-col items-start gap-2">
            Ada draf yang belum dikirim di perangkat ini.
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  form.reset({ ...pendingDraft, project_id: projectId, report_date: reportDate });
                  setPendingDraft(null);
                }}
              >
                Pakai draf
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  clearDraft(key);
                  setPendingDraft(null);
                }}
              >
                Buang draf
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Kegiatan hari ini</CardTitle>
          <CardDescription>
            Tenaga kerja dihitung dari absensi: {formatNumber(workforce)} orang Hadir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Controller
              name="no_activity"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="report-no-activity">Tidak Ada Kegiatan</FieldLabel>
                    <FieldDescription>Libur, hujan sepanjang hari, atau stop kerja.</FieldDescription>
                  </FieldContent>
                  <Switch id="report-no-activity" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
            {noActivity ? (
              <Controller
                name="no_activity_reason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="report-reason">Alasan *</FieldLabel>
                    <Textarea
                      id="report-reason"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      maxLength={300}
                      placeholder="Mis. hujan lebat sepanjang hari"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              {select("weather_morning", "Cuaca pagi")}
              {select("weather_midday", "Cuaca siang")}
              {select("weather_afternoon", "Cuaca sore")}
            </div>
            {noActivity ? null : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Controller
                  name="effective_hours"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="report-hours">Jam kerja efektif</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="report-hours"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={24}
                          step={0.5}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                          aria-invalid={fieldState.invalid}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>jam</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  name="safety_briefing"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal" className="sm:pt-6">
                      <FieldLabel htmlFor="report-briefing">Safety briefing</FieldLabel>
                      <Switch id="report-briefing" checked={field.value} onCheckedChange={field.onChange} />
                    </Field>
                  )}
                />
                {briefing ? (
                  <Controller
                    name="briefing_participants"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="report-participants">Peserta briefing *</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            id="report-participants"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(event.target.value === "" ? null : Number(event.target.value))
                            }
                            aria-invalid={fieldState.invalid}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>orang</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                ) : null}
              </div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {noActivity ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas & progres</CardTitle>
            <CardDescription>Isi progres kumulatif setelah hari ini; progres tidak bisa turun.</CardDescription>
            <CardAction>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!sections.length}
                onClick={() =>
                  activities.append({
                    section_id: "",
                    stage_id: "",
                    // Empty until filled, so a forgotten value fails validation instead of sending 0%.
                    progress_after: null as unknown as number,
                    notes: null,
                  })
                }
              >
                <PlusIcon />
                Aktivitas
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!sections.length ? (
              <p className="text-sm text-muted-foreground">Proyek ini belum punya seksi tarik. Hubungi Operasional.</p>
            ) : null}
            {activities.fields.map((item, index) => {
              const value = activityValues?.[index];
              const now = value?.section_id && value?.stage_id ? current[`${value.section_id}|${value.stage_id}`] ?? 0 : null;
              return (
                <div key={item.id} className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Controller
                      name={`activities.${index}.section_id`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`activity-section-${index}`}>Seksi</FieldLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger id={`activity-section-${index}`} className="w-full" aria-invalid={fieldState.invalid}>
                              <SelectValue placeholder="Pilih seksi" />
                            </SelectTrigger>
                            <SelectContent>
                              {sections.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`activities.${index}.stage_id`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`activity-stage-${index}`}>Tahapan</FieldLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger id={`activity-stage-${index}`} className="w-full" aria-invalid={fieldState.invalid}>
                              <SelectValue placeholder="Pilih tahapan" />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <Controller
                      name={`activities.${index}.progress_after`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="sm:w-40">
                          <FieldLabel htmlFor={`activity-progress-${index}`}>Progres kumulatif</FieldLabel>
                          <InputGroup>
                            <InputGroupInput
                              id={`activity-progress-${index}`}
                              type="number"
                              inputMode="decimal"
                              min={0}
                              max={100}
                              step={5}
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(event.target.value === "" ? null : Number(event.target.value))
                              }
                              aria-invalid={fieldState.invalid}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                          {now !== null ? <FieldDescription>Sekarang {formatNumber(now, 2)}%</FieldDescription> : null}
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`activities.${index}.notes`}
                      control={form.control}
                      render={({ field }) => (
                        <Field className="flex-1">
                          <FieldLabel htmlFor={`activity-notes-${index}`}>Keterangan</FieldLabel>
                          <Input
                            id={`activity-notes-${index}`}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            maxLength={300}
                            placeholder="Mis. tarik konduktor T.15–T.16"
                          />
                        </Field>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:mt-6"
                      onClick={() => activities.remove(index)}
                      aria-label={`Hapus aktivitas ${index + 1}`}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              );
            })}
            {activitiesError ? <p className="text-sm text-destructive">{activitiesError}</p> : null}
          </CardContent>
        </Card>
      )}

      {noActivity ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Kendala</CardTitle>
            <CardDescription>Kosongkan bila tidak ada kendala.</CardDescription>
            <CardAction>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => obstacles.append({ category: "other", description: "" })}
              >
                <PlusIcon />
                Kendala
              </Button>
            </CardAction>
          </CardHeader>
          {obstacles.fields.length ? (
            <CardContent className="flex flex-col gap-3">
              {obstacles.fields.map((item, index) => (
                <div key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Controller
                    name={`obstacles.${index}.category`}
                    control={form.control}
                    render={({ field }) => (
                      <Field className="sm:w-56">
                        <FieldLabel htmlFor={`obstacle-category-${index}`}>Kategori</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id={`obstacle-category-${index}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OBSTACLE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {OBSTACLE_LABELS[category]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                  <Controller
                    name={`obstacles.${index}.description`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="flex-1">
                        <FieldLabel htmlFor={`obstacle-description-${index}`}>Keterangan</FieldLabel>
                        <Input
                          id={`obstacle-description-${index}`}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          maxLength={500}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="sm:mt-6"
                    onClick={() => obstacles.remove(index)}
                    aria-label={`Hapus kendala ${index + 1}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </CardContent>
          ) : null}
        </Card>
      )}

      <Card>
        <CardContent>
          <FieldGroup className="gap-4">
            {noActivity ? null : textarea("equipment_used", "Alat utama yang dipakai", "Mis. puller-tensioner, winch 5 ton")}
            {textarea("plan_tomorrow", "Rencana esok hari")}
            {textarea("notes", "Catatan")}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Mengirim…" : "Kirim laporan"}
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={cancelHref}>Batal</Link>
        </Button>
        {draftSaved ? <span className="text-xs text-muted-foreground">Draf tersimpan di perangkat ini.</span> : null}
      </div>
    </form>
  );
}
