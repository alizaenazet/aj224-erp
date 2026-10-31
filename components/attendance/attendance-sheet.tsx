"use client";

import { CheckCheckIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CertStateBadge } from "@/components/assignments/cert-state-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveAttendance } from "@/lib/attendance/actions";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_VARIANTS,
  type AttendanceStatus,
  type SheetPerson,
} from "@/lib/attendance/labels";
import { VERIFICATION_LABELS } from "@/lib/employees/labels";
import { formatDate } from "@/lib/format";

type Draft = { status: AttendanceStatus | null; overtime: string };

type AttendanceSheetProps = {
  /** Null for office (kantor) attendance. */
  projectId: string | null;
  date: string;
  people: SheetPerson[];
  canEdit: boolean;
  /** Larger controls for the Lapangan phone screen. */
  field?: boolean;
};

/** One day's attendance: status and overtime per person, Tandai Semua Hadir, Simpan (HCM-09, HCM-10). */
export function AttendanceSheet({ projectId, date, people, canEdit, field = false }: AttendanceSheetProps) {
  // A person already recorded under another project (or kantor) that day is shown read-only.
  const elsewhere = (person: SheetPerson) => person.record !== null && person.record.project_id !== projectId;
  const initial = () =>
    Object.fromEntries(
      people.map((person) => [
        person.employee_id,
        {
          status: elsewhere(person) ? null : (person.record?.status ?? null),
          overtime: elsewhere(person) ? "0" : String(person.record?.overtime_hours ?? 0),
        },
      ]),
    ) as Record<string, Draft>;
  const [drafts, setDrafts] = useState<Record<string, Draft>>(initial);
  const [pending, setPending] = useState(false);

  const editable = people.filter((person) => !elsewhere(person));
  const filled = editable.filter((person) => drafts[person.employee_id]?.status).length;
  const saved = editable.filter((person) => person.record).length;
  const size = field ? "lg" : "default";

  function update(employeeId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [employeeId]: { ...current[employeeId], ...patch } }));
  }

  function markAllPresent() {
    setDrafts((current) => {
      const next = { ...current };
      for (const person of editable) {
        if (!next[person.employee_id]?.status) next[person.employee_id] = { ...next[person.employee_id], status: "present" };
      }
      return next;
    });
  }

  async function save() {
    const filledRows = editable
      .filter((person) => drafts[person.employee_id]?.status)
      .map((person) => {
        const draft = drafts[person.employee_id];
        return {
          person,
          row: {
            employee_id: person.employee_id,
            status: draft.status as AttendanceStatus,
            overtime_hours: draft.status === "present" ? Number(draft.overtime) || 0 : 0,
            notes: person.record?.notes ?? null,
          },
        };
      });
    if (!filledRows.length) {
      toast.error("Isi status minimal satu orang, atau pakai Tandai Semua Hadir.");
      return;
    }
    // Only new or changed rows are sent, so an older record that no longer
    // passes the crew rules (e.g. an assignment ended since) cannot block the rest.
    const rows = filledRows
      .filter(({ person, row }) =>
        !person.record || person.record.status !== row.status || person.record.overtime_hours !== row.overtime_hours,
      )
      .map(({ row }) => row);
    if (!rows.length) {
      toast.info("Tidak ada perubahan untuk disimpan.");
      return;
    }
    setPending(true);
    const result = await saveAttendance({ project_id: projectId, work_date: date, rows });
    setPending(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  if (people.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>{projectId ? "Belum ada kru" : "Belum ada staf kantor aktif"}</EmptyTitle>
          <EmptyDescription>
            {projectId
              ? "Kru proyek berasal dari penugasan aktif pada tanggal ini. Hubungi HCM untuk penugasan."
              : "Staf kantor aktif pada tanggal ini akan tampil di sini."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Absensi {formatDate(date)}</CardTitle>
          <CardDescription>
            {filled} dari {editable.length} orang diisi · {saved} tersimpan
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Progress value={editable.length ? (filled / editable.length) * 100 : 0} />
          {canEdit ? (
            <div className="grid gap-2 sm:flex sm:justify-end">
              <Button variant="outline" size={size} onClick={markAllPresent} disabled={pending}>
                <CheckCheckIcon />
                Tandai Semua Hadir
              </Button>
              <Button size={size} onClick={() => void save()} disabled={pending}>
                {pending ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-2 xl:grid-cols-2">
        {people.map((person) => {
          const draft = drafts[person.employee_id];
          const other = elsewhere(person);
          return (
            <Card key={person.employee_id} size="sm">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium">{person.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {person.employee_no} · {person.position}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {person.cert_state && person.cert_state !== "valid" ? (
                      <CertStateBadge state={person.cert_state} issues={person.cert_issues} />
                    ) : null}
                    {person.overridden ? <Badge variant="destructive">Override</Badge> : null}
                    {person.verification_status === "pending" ? (
                      <Badge variant="warning">{VERIFICATION_LABELS.pending}</Badge>
                    ) : null}
                    {other ? (
                      <Badge variant="outline">
                        Tercatat {person.record?.project_id ? "di proyek lain" : "di kantor"}:{" "}
                        {ATTENDANCE_STATUS_LABELS[person.record!.status]}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {other ? null : canEdit ? (
                  <div className="flex gap-2">
                    <Select
                      value={draft?.status ?? ""}
                      onValueChange={(value) =>
                        update(person.employee_id, {
                          status: value as AttendanceStatus,
                          overtime: value === "present" ? draft?.overtime ?? "0" : "0",
                        })
                      }
                    >
                      <SelectTrigger
                        size={field ? "default" : "sm"}
                        className="w-full sm:w-36"
                        aria-label={`Status ${person.name}`}
                      >
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {ATTENDANCE_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputGroup className="w-32 shrink-0">
                      <InputGroupInput
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={24}
                        step={0.5}
                        value={draft?.overtime ?? "0"}
                        disabled={draft?.status !== "present"}
                        onChange={(event) => update(person.employee_id, { overtime: event.target.value })}
                        aria-label={`Jam lembur ${person.name}`}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>jam</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                ) : person.record ? (
                  <div className="flex items-center gap-2">
                    <Badge variant={ATTENDANCE_STATUS_VARIANTS[person.record.status]}>
                      {ATTENDANCE_STATUS_LABELS[person.record.status]}
                    </Badge>
                    {person.record.overtime_hours > 0 ? (
                      <span className="text-xs text-muted-foreground">Lembur {person.record.overtime_hours} jam</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Belum diisi</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
