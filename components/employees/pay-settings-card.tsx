"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HistoryIcon, PencilIcon, WalletIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { RupiahInput } from "@/components/app/rupiah-input";
import { AuditHistorySheet } from "@/components/audit/audit-history-sheet";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savePaySettings } from "@/lib/employees/actions";
import {
  PAY_COMPONENTS,
  PAY_TYPE_LABELS,
  type PaySettings,
} from "@/lib/employees/labels";
import { paySettingsSchema, type PaySettingsInput } from "@/lib/employees/schema";
import { formatRupiah } from "@/lib/format";

type PaySettingsCardProps = {
  employeeId: string;
  employeeName: string;
  settings: PaySettings | null;
  canManage: boolean;
  canViewHistory: boolean;
};

/** Pay settings (HCM-02): HCM edits; Finance and Direktur read. */
export function PaySettingsCard({
  employeeId,
  employeeName,
  settings,
  canManage,
  canViewHistory,
}: PaySettingsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const actions = (
    <div className="flex gap-2">
      {canViewHistory ? (
        <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon />
          Riwayat
        </Button>
      ) : null}
      {canManage && settings ? (
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <PencilIcon />
          Ubah
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      {settings ? (
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan gaji</CardTitle>
            <CardDescription>Hanya terlihat oleh HCM, Finance, dan Direktur.</CardDescription>
            <CardAction>{actions}</CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Tipe gaji</dt>
                <dd>
                  <Badge variant="outline">{PAY_TYPE_LABELS[settings.pay_type]}</Badge>
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">
                  {settings.pay_type === "daily" ? "Upah harian" : "Gaji pokok"}
                </dt>
                <dd className="font-medium">
                  {formatRupiah(settings.pay_type === "daily" ? settings.daily_wage : settings.base_salary)}
                </dd>
              </div>
              {PAY_COMPONENTS.map((component) => (
                <div key={component.name} className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{component.label}</dt>
                  <dd>{formatRupiah(settings[component.name])}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WalletIcon />
            </EmptyMedia>
            <EmptyTitle>Pengaturan gaji belum diisi</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? "Isi tipe gaji dan komponennya sebelum payroll pertama."
                : "HCM belum mengisi pengaturan gaji karyawan ini."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage || canViewHistory ? (
            <EmptyContent>
              <div className="flex gap-2">
                {canViewHistory ? (
                  <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                    <HistoryIcon />
                    Riwayat
                  </Button>
                ) : null}
                {canManage ? <Button onClick={() => setEditOpen(true)}>Isi pengaturan gaji</Button> : null}
              </div>
            </EmptyContent>
          ) : null}
        </Empty>
      )}

      {canManage ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Pengaturan gaji</DialogTitle>
              <DialogDescription>{employeeName}. Setiap perubahan tercatat di log audit.</DialogDescription>
            </DialogHeader>
            {editOpen ? (
              <PaySettingsForm
                employeeId={employeeId}
                settings={settings}
                onDone={() => setEditOpen(false)}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      <AuditHistorySheet
        target={
          historyOpen
            ? { table: "employee_pay_settings", recordId: employeeId, title: `Gaji · ${employeeName}` }
            : null
        }
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}

function PaySettingsForm({
  employeeId,
  settings,
  onDone,
}: {
  employeeId: string;
  settings: PaySettings | null;
  onDone: () => void;
}) {
  const form = useForm<PaySettingsInput>({
    resolver: zodResolver(paySettingsSchema) as unknown as Resolver<PaySettingsInput>,
    defaultValues: settings ?? {
      daily_wage: null,
      base_salary: null,
      fixed_allowance: 0,
      meal_allowance_per_day: 0,
      field_allowance_per_day: 0,
      overtime_rate_per_hour: 0,
      fixed_deduction: 0,
    },
  });
  const payType = useWatch({ control: form.control, name: "pay_type" });

  async function onSubmit(values: PaySettingsInput) {
    const result = await savePaySettings({ employeeId, values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  const amountFields: { name: keyof PaySettingsInput; label: string }[] = [
    payType === "monthly"
      ? { name: "base_salary", label: "Gaji pokok *" }
      : { name: "daily_wage", label: "Upah harian *" },
    ...PAY_COMPONENTS,
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="pay_type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="pay-type">Tipe gaji *</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="pay-type" aria-invalid={fieldState.invalid} className="w-full sm:w-1/2">
                  <SelectValue placeholder="Pilih tipe gaji" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAY_TYPE_LABELS).map(([value, label]) => (
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
        {amountFields.map((config) => (
          <Controller
            key={config.name}
            name={config.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`pay-${config.name}`}>{config.label}</FieldLabel>
                <RupiahInput
                  id={`pay-${config.name}`}
                  value={field.value as number | null}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ))}
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
