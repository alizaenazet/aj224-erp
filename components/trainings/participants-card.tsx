"use client";

import { UsersIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmployeeMultiPicker } from "@/components/trainings/employee-multi-picker";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addParticipants, removeParticipant, setParticipantResult } from "@/lib/trainings/actions";
import {
  PARTICIPANT_RESULT_LABELS,
  type EmployeeOption,
  type ParticipantResult,
  type ParticipantRow,
} from "@/lib/trainings/labels";

const RESULT_VARIANTS: Record<ParticipantResult, "outline" | "secondary" | "destructive"> = {
  pending: "outline",
  passed: "secondary",
  failed: "destructive",
};

type ParticipantsCardProps = {
  trainingId: string;
  certificateTypeName: string | null;
  participants: ParticipantRow[];
  employees: EmployeeOption[];
  canManage: boolean;
};

/** Participants and results; Lulus issues the certificate (HCM-07). */
export function ParticipantsCard({
  trainingId,
  certificateTypeName,
  participants,
  employees,
  canManage,
}: ParticipantsCardProps) {
  const [toAdd, setToAdd] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [revoke, setRevoke] = useState<{ participant: ParticipantRow; result: ParticipantResult } | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);

  async function changeResult(participant: ParticipantRow, result: ParticipantResult) {
    setPending(true);
    const response = await setParticipantResult({ trainingId, employeeId: participant.employee_id, result });
    setPending(false);
    setRevokeOpen(false);
    if (response.ok) toast.success(response.message);
    else toast.error(response.error);
  }

  async function add() {
    setPending(true);
    const response = await addParticipants({ trainingId, employeeIds: toAdd });
    setPending(false);
    if (!response.ok) {
      toast.error(response.error);
      return;
    }
    toast.success(response.message);
    setToAdd([]);
  }

  async function remove(participant: ParticipantRow) {
    setPending(true);
    const response = await removeParticipant({ trainingId, employeeId: participant.employee_id });
    setPending(false);
    if (response.ok) toast.success(response.message);
    else toast.error(response.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peserta</CardTitle>
        <CardDescription>
          {certificateTypeName
            ? `Peserta Lulus otomatis mendapat sertifikat ${certificateTypeName}.`
            : "Pelatihan ini tidak menghasilkan sertifikat."}
        </CardDescription>
        {canManage ? (
          <CardAction className="flex flex-wrap gap-2">
            <EmployeeMultiPicker
              employees={employees}
              selected={toAdd}
              onChange={setToAdd}
              excluded={participants.map((participant) => participant.employee_id)}
              label="Pilih karyawan"
            />
            <Button disabled={pending || toAdd.length === 0} onClick={() => void add()}>
              Tambahkan
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada peserta</EmptyTitle>
              <EmptyDescription>Peserta pelatihan akan tampil di sini.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIK Karyawan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Hasil</TableHead>
                <TableHead>Sertifikat</TableHead>
                {canManage ? (
                  <TableHead>
                    <span className="sr-only">Hapus</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.employee_id}>
                  <TableCell>{participant.employee?.employee_no ?? "—"}</TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/hr/employees/${participant.employee_id}?tab=certificates`}
                      className="underline-offset-4 hover:underline"
                    >
                      {participant.employee?.full_name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{participant.employee?.position?.name ?? "—"}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <Select
                        value={participant.result}
                        disabled={pending}
                        onValueChange={(value) => {
                          const result = value as ParticipantResult;
                          if (participant.result === "passed" && participant.certificate_id) {
                            setRevoke({ participant, result });
                            setRevokeOpen(true);
                          } else {
                            void changeResult(participant, result);
                          }
                        }}
                      >
                        <SelectTrigger
                          className="w-36"
                          aria-label={`Hasil ${participant.employee?.full_name ?? ""}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PARTICIPANT_RESULT_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={RESULT_VARIANTS[participant.result]}>
                        {PARTICIPANT_RESULT_LABELS[participant.result]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.certificate_id ? (
                      <Badge variant="secondary">Dibuat</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        aria-label={`Hapus ${participant.employee?.full_name ?? "peserta"}`}
                        onClick={() => void remove(participant)}
                      >
                        <XIcon />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah hasil dari Lulus?</AlertDialogTitle>
            <AlertDialogDescription>
              Sertifikat {certificateTypeName} milik {revoke?.participant.employee?.full_name} yang dibuat dari
              pelatihan ini akan dihapus, termasuk nomor yang sudah dilengkapi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                if (revoke) void changeResult(revoke.participant, revoke.result);
              }}
            >
              Ubah hasil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
