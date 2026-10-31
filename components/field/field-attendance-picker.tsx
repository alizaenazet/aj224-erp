"use client";

import { useListParams } from "@/components/data-table/use-list-params";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Project (when more than one) and date (today back to H−3) for Absensi Hari Ini (HCM-09). */
export function FieldAttendancePicker({
  projectId,
  date,
  projects,
  dates,
}: {
  projectId: string;
  date: string;
  projects: { value: string; label: string }[];
  dates: { value: string; label: string }[];
}) {
  const { update } = useListParams();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {projects.length > 1 ? (
        <Field className="sm:w-80">
          <FieldLabel htmlFor="field-project">Proyek</FieldLabel>
          <Select value={projectId} onValueChange={(value) => update({ project: value })}>
            <SelectTrigger id="field-project" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.value} value={project.value}>
                  {project.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      <Field className="sm:w-56">
        <FieldLabel htmlFor="field-date">Tanggal</FieldLabel>
        <Select value={date} onValueChange={(value) => update({ date: value })}>
          <SelectTrigger id="field-date" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dates.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
