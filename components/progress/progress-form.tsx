"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { formatNumber } from "@/lib/format";
import { updateSectionProgress } from "@/lib/progress/actions";
import { formatProgress, type SectionRow, type StageRow } from "@/lib/progress/labels";
import { sectionProgressSchema } from "@/lib/progress/schema";

type ProgressFormProps = {
  projectId: string;
  section: SectionRow;
  stages: StageRow[];
  /** Current progress by stage id. */
  cells: Record<string, number>;
  onDone: () => void;
};

/** Cumulative stage progress of one section (PRJ-06); unchanged stages are not logged. */
export function ProgressForm({ projectId, section, stages, cells, onDone }: ProgressFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(stages.map((stage) => [stage.id, String(cells[stage.id] ?? 0)])),
  );
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  const totalWeight = stages.reduce((sum, stage) => sum + stage.weight, 0);
  const preview =
    totalWeight > 0
      ? stages.reduce((sum, stage) => sum + stage.weight * (Number(values[stage.id]) || 0), 0) / totalWeight
      : 0;

  async function save() {
    const parsed = sectionProgressSchema.safeParse({
      values: stages.map((stage) => ({ stage_id: stage.id, progress: values[stage.id] })),
      note,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await updateSectionProgress({ projectId, sectionId: section.id, values: parsed.data });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        {stages.map((stage) => {
          const value = Number(values[stage.id]);
          const invalid = values[stage.id] === "" || Number.isNaN(value) || value < 0 || value > 100;
          return (
            <Field key={stage.id} data-invalid={invalid}>
              <FieldLabel htmlFor={`progress-${stage.id}`}>
                {stage.name} <span className="font-normal text-muted-foreground">(bobot {formatNumber(stage.weight, 2)})</span>
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={`progress-${stage.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={5}
                  value={values[stage.id]}
                  onChange={(event) => setValues((current) => ({ ...current, [stage.id]: event.target.value }))}
                  aria-invalid={invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>%</InputGroupText>
                  <InputGroupButton
                    size="xs"
                    onClick={() => setValues((current) => ({ ...current, [stage.id]: "100" }))}
                    aria-label={`${stage.name} selesai`}
                  >
                    100
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {(cells[stage.id] ?? 0) !== value && !invalid ? (
                <FieldDescription>Sebelumnya {formatProgress(cells[stage.id] ?? 0, 2)}</FieldDescription>
              ) : null}
            </Field>
          );
        })}
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="progress-note">Catatan</FieldLabel>
          <Input
            id="progress-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            placeholder="Mis. tarik konduktor T.15–T.16"
          />
          <FieldDescription>
            Progres seksi {section.code} menjadi {formatProgress(preview)} (sebelumnya {formatProgress(section.progress)}).
          </FieldDescription>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button onClick={() => void save()} disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan progres"}
        </Button>
      </DialogFooter>
    </div>
  );
}
