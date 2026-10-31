"use client";

import { ListIcon } from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/app/date-picker";
import { useListParams } from "@/components/data-table/use-list-params";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const OFFICE_SCOPE = "office";

/** Kantor or a project, and the date, kept in the URL (SDM → Absensi). */
export function AttendanceScope({
  scope,
  date,
  today,
  projects,
}: {
  scope: string;
  date: string;
  today: string;
  projects: { value: string; label: string }[];
}) {
  const { update } = useListParams();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Field className="sm:w-80">
          <FieldLabel htmlFor="attendance-scope">Absensi untuk</FieldLabel>
          <Select value={scope} onValueChange={(value) => update({ scope: value })}>
            <SelectTrigger id="attendance-scope" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OFFICE_SCOPE}>Kantor (staf kantor)</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.value} value={project.value}>
                  {project.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="sm:w-48">
          <FieldLabel htmlFor="attendance-date">Tanggal</FieldLabel>
          <DatePicker id="attendance-date" value={date} onChange={(value) => update({ date: value })} max={today} />
        </Field>
      </div>
      <Button asChild variant="outline">
        <Link href="/hr/attendance/recap">
          <ListIcon />
          Rekap absensi
        </Link>
      </Button>
    </div>
  );
}
