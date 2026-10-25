"use client";

import { BadgeCheckIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuditHistorySheet } from "@/components/audit/audit-history-sheet";
import { CertificateDialog } from "@/components/certifications/certificate-dialog";
import { CertificateScan } from "@/components/certifications/certificate-scan";
import { CertificateStatusBadge } from "@/components/certifications/certificate-status-badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCertificate } from "@/lib/certifications/actions";
import {
  describeDaysLeft,
  isFitStatus,
  type CertificateRow,
  type RequirementStatus,
} from "@/lib/certifications/labels";
import type { CertificateTypeOption } from "@/lib/certifications/queries";
import { formatDate } from "@/lib/format";

type EmployeeCertificatesProps = {
  employeeId: string;
  employeeName: string;
  positionName: string;
  requirements: { id: string; name: string }[];
  certificates: CertificateRow[];
  /** Certificate id → scan attachment id. */
  scans: Record<string, string>;
  types: CertificateTypeOption[];
  canManage: boolean;
  canViewHistory: boolean;
};

/** Sertifikat tab: fitness for the position (§11.5) and all certificates (HCM-03). */
export function EmployeeCertificates({
  employeeId,
  employeeName,
  positionName,
  requirements,
  certificates,
  scans,
  types,
  canManage,
  canViewHistory,
}: EmployeeCertificatesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CertificateRow | null>(null);
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [deleteTarget, setDeleteTarget] = useState<CertificateRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<CertificateRow | null>(null);

  const required = requirements.map((requirement) => {
    const current = certificates.find(
      (certificate) => certificate.is_current && certificate.certificate_type_id === requirement.id,
    );
    const status: RequirementStatus = current ? current.status : "missing";
    return { ...requirement, current, status };
  });
  const fit = required.every((requirement) => isFitStatus(requirement.status));

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteCertificate(deleteTarget.id);
    setPending(false);
    setConfirmOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Sertifikat wajib jabatan {positionName}</CardTitle>
          <CardDescription>
            Layak Tugas bila semua sertifikat wajib berstatus Berlaku atau Segera Kedaluwarsa.
          </CardDescription>
          <CardAction>
            <Badge variant={fit ? "secondary" : "destructive"}>
              {fit ? "Layak Tugas" : "Belum Layak Tugas"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {required.length === 0 ? (
            <p className="text-sm text-muted-foreground">Jabatan ini tidak mewajibkan sertifikat.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {required.map((requirement) => (
                <li key={requirement.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{requirement.name}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {requirement.current
                      ? requirement.current.expiry_date
                        ? `s.d. ${formatDate(requirement.current.expiry_date)}`
                        : "Seumur hidup"
                      : null}
                    <CertificateStatusBadge status={requirement.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semua sertifikat</CardTitle>
          <CardDescription>Sertifikat lama yang sudah diperbarui ditandai Diperbarui.</CardDescription>
          {canManage ? (
            <CardAction>
              <Button
                size="sm"
                onClick={() => {
                  setEditTarget(null);
                  setDialogOpen(true);
                }}
              >
                <PlusIcon />
                Tambah sertifikat
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BadgeCheckIcon />
                </EmptyMedia>
                <EmptyTitle>Belum ada sertifikat</EmptyTitle>
                <EmptyDescription>Sertifikat karyawan ini akan tampil di sini.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Penerbit</TableHead>
                  <TableHead>Terbit</TableHead>
                  <TableHead>Kedaluwarsa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scan</TableHead>
                  {canManage || canViewHistory ? (
                    <TableHead>
                      <span className="sr-only">Tindakan</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell className="font-medium">{certificate.certificate_type_name}</TableCell>
                    <TableCell>{certificate.certificate_no ?? "—"}</TableCell>
                    <TableCell>{certificate.issuer ?? "—"}</TableCell>
                    <TableCell>{formatDate(certificate.issued_date)}</TableCell>
                    <TableCell>
                      {certificate.expiry_date ? (
                        <div className="flex flex-col">
                          <span>{formatDate(certificate.expiry_date)}</span>
                          {certificate.is_current ? (
                            <span className="text-xs text-muted-foreground">
                              {describeDaysLeft(certificate.days_left)}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        "Seumur hidup"
                      )}
                    </TableCell>
                    <TableCell>
                      {certificate.is_current ? (
                        <CertificateStatusBadge status={certificate.status} />
                      ) : (
                        <Badge variant="outline">Diperbarui</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <CertificateScan
                        certificateId={certificate.id}
                        scanId={scans[certificate.id] ?? null}
                        canManage={canManage}
                      />
                    </TableCell>
                    {canManage || canViewHistory ? (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Tindakan untuk ${certificate.certificate_type_name}`}
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canViewHistory ? (
                              <DropdownMenuItem onSelect={() => setHistoryTarget(certificate)}>
                                Riwayat
                              </DropdownMenuItem>
                            ) : null}
                            {canManage ? (
                              <>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditTarget(certificate);
                                    setDialogOpen(true);
                                  }}
                                >
                                  Ubah
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => {
                                    setDeleteTarget(certificate);
                                    setConfirmOpen(true);
                                  }}
                                >
                                  Hapus
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canManage ? (
        <CertificateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employeeId={employeeId}
          employeeName={employeeName}
          certificate={editTarget}
          types={types}
        />
      ) : null}

      <AuditHistorySheet
        target={
          historyTarget
            ? {
                table: "employee_certificates",
                recordId: historyTarget.id,
                title: `${historyTarget.certificate_type_name} · ${employeeName}`,
              }
            : null
        }
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null);
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus sertifikat?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.certificate_type_name}${deleteTarget.certificate_no ? ` (${deleteTarget.certificate_no})` : ""} milik ${employeeName} beserta scan-nya dihapus. Gunakan hanya untuk data yang salah input.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
