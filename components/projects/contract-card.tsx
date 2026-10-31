"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ContractFields, EMPTY_CONTRACT, type ContractFormValues } from "@/components/projects/contract-fields";
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
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { saveContract } from "@/lib/projects/actions";
import type { ProjectRow } from "@/lib/projects/labels";
import { contractSchema } from "@/lib/projects/schema";

const formSchema = z.object({ contract: contractSchema });

/** Contract data with the current value and finish date after addenda (PRJ-02). */
export function ContractCard({ project, canManage }: { project: ProjectRow; canManage: boolean }) {
  const [open, setOpen] = useState(false);

  const rows: [string, string][] = [
    ["Nomor kontrak/SPK", project.contract_no ?? "—"],
    ["Tanggal kontrak", formatDate(project.contract_date)],
    ["Nilai kontrak awal", formatRupiah(project.base_contract_value)],
    ["Nilai kontrak berlaku", formatRupiah(project.contract_value)],
    ["PPN", project.ppn_applicable === null ? "—" : project.ppn_applicable ? "Dikenakan" : "Tidak dikenakan"],
    [
      "Masa pemeliharaan",
      project.maintenance_months === null ? "—" : `${formatNumber(project.maintenance_months)} bulan`,
    ],
    ["Target selesai berlaku", formatDate(project.finish_date)],
    ["Lingkup pekerjaan", project.scope ?? "—"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontrak</CardTitle>
        <CardDescription>
          {project.addendum_count > 0
            ? `Nilai dan target selesai berlaku mengikuti addendum terakhir (${project.addendum_count} addendum).`
            : "Nilai sebelum PPN. Perubahan nilai atau jadwal dicatat lewat addendum."}
        </CardDescription>
        {canManage ? (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <PencilIcon />
              Ubah kontrak
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words whitespace-pre-line">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>

      {canManage ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ubah kontrak</DialogTitle>
              <DialogDescription>Nilai kontrak awal; perubahan setelah kontrak ditandatangani dicatat lewat addendum.</DialogDescription>
            </DialogHeader>
            {open ? <ContractForm project={project} onDone={() => setOpen(false)} /> : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}

function ContractForm({ project, onDone }: { project: ProjectRow; onDone: () => void }) {
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<ContractFormValues>,
    defaultValues: {
      contract: {
        ...EMPTY_CONTRACT,
        contract_no: project.contract_no,
        contract_date: project.contract_date,
        contract_value: project.base_contract_value ?? 0,
        ppn_applicable: project.ppn_applicable ?? true,
        maintenance_months: project.maintenance_months,
        scope: project.scope,
      },
    },
  });

  async function onSubmit(values: ContractFormValues) {
    const result = await saveContract({ projectId: project.id, values: values.contract });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <ContractFields control={form.control} />
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
