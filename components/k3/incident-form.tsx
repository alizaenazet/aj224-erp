"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveIncident } from "@/lib/k3/actions";
import {
  CLASSIFICATION_LABELS,
  CLASSIFICATIONS,
  INVOLVEMENT_LABELS,
  INVOLVEMENTS,
  type Classification,
  type Involvement,
} from "@/lib/k3/labels";
import { incidentSchema, type IncidentInput } from "@/lib/k3/schema";

type Person = { key: string; mode: "employee" | "external"; employee_id: string; external_name: string; involvement: Involvement; injury: string };

let keySeed = 0;
const nextKey = () => `person-${++keySeed}`;

/** Lapor / ubah insiden K3 (K3-01): short enough for a phone; photos are added on the incident page. */
export function IncidentForm({
  incidentId,
  defaults,
  projects,
  sections,
  employees,
  today,
  now,
}: {
  incidentId?: string;
  defaults?: Partial<IncidentInput>;
  projects: ComboboxOption[];
  sections: (ComboboxOption & { project_id: string })[];
  employees: ComboboxOption[];
  today: string;
  /** Current WIB time "HH:mm". */
  now: string;
}) {
  const router = useRouter();
  const [project, setProject] = useState(defaults?.project_id ?? (projects.length === 1 ? projects[0].value : ""));
  const [date, setDate] = useState<string | null>(defaults?.occurred_date ?? today);
  const [time, setTime] = useState(defaults?.occurred_time ?? now);
  const [section, setSection] = useState(defaults?.section_id ?? "");
  const [locationNote, setLocationNote] = useState(defaults?.location_note ?? "");
  const [classification, setClassification] = useState<Classification | "">(defaults?.classification ?? "");
  const [chronology, setChronology] = useState(defaults?.chronology ?? "");
  const [bodyParts, setBodyParts] = useState(defaults?.body_parts ?? "");
  const [witnesses, setWitnesses] = useState(defaults?.witnesses ?? "");
  const [immediate, setImmediate] = useState(defaults?.immediate_action ?? "");
  const [people, setPeople] = useState<Person[]>(
    (defaults?.people ?? []).map((person) => ({
      key: nextKey(),
      mode: person.employee_id ? "employee" : "external",
      employee_id: person.employee_id ?? "",
      external_name: person.external_name ?? "",
      involvement: person.involvement,
      injury: person.injury ?? "",
    })),
  );
  const [pending, setPending] = useState(false);

  const sectionOptions = sections.filter((option) => option.project_id === project);
  const updatePerson = (key: string, patch: Partial<Person>) =>
    setPeople((current) => current.map((person) => (person.key === key ? { ...person, ...patch } : person)));

  async function submit() {
    const parsed = incidentSchema.safeParse({
      project_id: project,
      occurred_date: date,
      occurred_time: time,
      section_id: section,
      location_note: locationNote,
      classification: classification || undefined,
      chronology,
      body_parts: bodyParts,
      witnesses,
      immediate_action: immediate,
      people: people.map((person) => ({
        employee_id: person.mode === "employee" ? person.employee_id : null,
        external_name: person.mode === "external" ? person.external_name : null,
        involvement: person.involvement,
        injury: person.injury,
      })),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await saveIncident({ id: incidentId ?? null, values: parsed.data });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/operations/incidents/${result.data?.id}${incidentId ? "" : "#foto"}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Kejadian</CardTitle>
          <CardDescription>Simpan dulu, lalu tambahkan foto di halaman insiden. Investigasi diisi kemudian oleh Operasional.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="incident-project">Proyek *</FieldLabel>
              <Combobox
                id="incident-project"
                value={project}
                onChange={(value) => {
                  setProject(value);
                  setSection("");
                }}
                options={projects}
                placeholder="Pilih proyek"
                searchPlaceholder="Cari kode atau nama proyek"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-date">Tanggal *</FieldLabel>
              <DatePicker id="incident-date" value={date} onChange={setDate} max={today} />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-time">Jam (WIB) *</FieldLabel>
              <Input id="incident-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-section">Seksi</FieldLabel>
              <Combobox
                id="incident-section"
                value={section}
                onChange={setSection}
                options={sectionOptions}
                placeholder="Pilih seksi (opsional)"
                emptyText="Belum ada seksi."
                disabled={!project}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-location">Tower / lokasi</FieldLabel>
              <Input
                id="incident-location"
                value={locationNote}
                onChange={(event) => setLocationNote(event.target.value)}
                maxLength={120}
                placeholder="Mis. T.14"
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="incident-class">Klasifikasi *</FieldLabel>
              <Select value={classification} onValueChange={(value) => setClassification(value as Classification)}>
                <SelectTrigger id="incident-class" className="w-full">
                  <SelectValue placeholder="Pilih klasifikasi" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSIFICATIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {CLASSIFICATION_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classification === "lti" || classification === "fatal" ? (
                <FieldDescription>Direktur dan Operasional langsung menerima notifikasi saat disimpan.</FieldDescription>
              ) : null}
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="incident-chronology">Kronologi *</FieldLabel>
              <Textarea
                id="incident-chronology"
                value={chronology}
                onChange={(event) => setChronology(event.target.value)}
                maxLength={3000}
                rows={4}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-body">Bagian tubuh terdampak</FieldLabel>
              <Input id="incident-body" value={bodyParts} onChange={(event) => setBodyParts(event.target.value)} maxLength={300} />
            </Field>
            <Field>
              <FieldLabel htmlFor="incident-witness">Saksi</FieldLabel>
              <Input id="incident-witness" value={witnesses} onChange={(event) => setWitnesses(event.target.value)} maxLength={300} />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="incident-immediate">Tindakan segera</FieldLabel>
              <Textarea id="incident-immediate" value={immediate} onChange={(event) => setImmediate(event.target.value)} maxLength={1000} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orang terlibat / korban</CardTitle>
          <CardDescription>Pilih dari data karyawan atau tulis nama pihak luar.</CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPeople((current) => [
                  ...current,
                  { key: nextKey(), mode: "employee", employee_id: "", external_name: "", involvement: "victim", injury: "" },
                ])
              }
            >
              <PlusIcon />
              Orang
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {people.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada korban atau orang terlibat.</p> : null}
          {people.map((person, index) => (
            <div key={person.key} className="grid gap-3 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`person-mode-${index}`}>Orang ke-{index + 1}</FieldLabel>
                <Select value={person.mode} onValueChange={(value) => updatePerson(person.key, { mode: value as Person["mode"] })}>
                  <SelectTrigger id={`person-mode-${index}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Karyawan</SelectItem>
                    <SelectItem value="external">Pihak luar</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {person.mode === "employee" ? (
                <Field>
                  <FieldLabel htmlFor={`person-employee-${index}`}>Karyawan</FieldLabel>
                  <Combobox
                    id={`person-employee-${index}`}
                    value={person.employee_id}
                    onChange={(value) => updatePerson(person.key, { employee_id: value })}
                    options={employees}
                    placeholder="Pilih karyawan"
                    searchPlaceholder="Cari nama atau NIK"
                  />
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor={`person-name-${index}`}>Nama pihak luar</FieldLabel>
                  <Input
                    id={`person-name-${index}`}
                    value={person.external_name}
                    onChange={(event) => updatePerson(person.key, { external_name: event.target.value })}
                    maxLength={120}
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor={`person-involvement-${index}`}>Keterlibatan</FieldLabel>
                <Select
                  value={person.involvement}
                  onValueChange={(value) => updatePerson(person.key, { involvement: value as Involvement })}
                >
                  <SelectTrigger id={`person-involvement-${index}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOLVEMENTS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {INVOLVEMENT_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-end gap-2">
                <Field className="flex-1">
                  <FieldLabel htmlFor={`person-injury-${index}`}>Cedera</FieldLabel>
                  <Input
                    id={`person-injury-${index}`}
                    value={person.injury}
                    onChange={(event) => updatePerson(person.key, { injury: event.target.value })}
                    maxLength={200}
                  />
                </Field>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPeople((current) => current.filter((item) => item.key !== person.key))}
                  aria-label={`Hapus orang ke-${index + 1}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button size="lg" onClick={() => void submit()} disabled={pending}>
        {pending ? "Menyimpan…" : incidentId ? "Simpan perubahan" : "Laporkan insiden"}
      </Button>
    </div>
  );
}
