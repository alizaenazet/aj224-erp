"use client";

import { DatePicker } from "@/components/app/date-picker";
import { useListParams } from "@/components/data-table/use-list-params";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Project and date of the report being written; Lapangan picks within the backdate window. */
export function ReportDayPicker({
  projectId,
  date,
  projects,
  dates,
  today,
}: {
  projectId: string;
  date: string;
  projects: { value: string; label: string }[];
  /** Allowed dates for Lapangan; null lets Operasional pick any past date. */
  dates: { value: string; label: string }[] | null;
  today: string;
}) {
  const { update } = useListParams();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {projects.length > 1 ? (
        <Field className="sm:w-80">
          <FieldLabel htmlFor="report-project">Proyek</FieldLabel>
          <Select value={projectId} onValueChange={(value) => update({ project: value })}>
            <SelectTrigger id="report-project" className="w-full">
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
        <FieldLabel htmlFor="report-date">Tanggal laporan</FieldLabel>
        {dates ? (
          <Select value={date} onValueChange={(value) => update({ date: value })}>
            <SelectTrigger id="report-date" className="w-full">
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
        ) : (
          <DatePicker id="report-date" value={date} onChange={(value) => update({ date: value })} max={today} />
        )}
      </Field>
    </div>
  );
}
