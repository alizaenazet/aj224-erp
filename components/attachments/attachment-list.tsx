"use client";

import { FileIcon, FileTextIcon, Loader2Icon, RotateCwIcon, Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAttachmentUpload } from "@/components/attachments/use-attachment-upload";
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
import { deleteAttachment } from "@/lib/attachments/actions";
import {
  ATTACHMENT_ENTITIES,
  FILE_ACCEPT,
  formatFileSize,
  type AttachmentEntityType,
  type AttachmentRow,
} from "@/lib/attachments/config";
import { formatDateTime } from "@/lib/format";

type AttachmentListProps = {
  entityType: AttachmentEntityType;
  entityId: string;
  attachments: AttachmentRow[];
  /** Categories offered for upload (in order). */
  categories: string[];
  canManage: boolean;
};

/** Files of one record with upload, open and remove (UMM-03). */
export function AttachmentList({
  entityType,
  entityId,
  attachments,
  categories,
  canManage,
}: AttachmentListProps) {
  const labels = ATTACHMENT_ENTITIES[entityType].categories;
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(categories[0]);
  const { items, add, retry, dismiss } = useAttachmentUpload({ entityType, entityId });
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [deleteTarget, setDeleteTarget] = useState<AttachmentRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteAttachment(deleteTarget.id);
    setPending(false);
    setConfirmOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Kategori berkas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((value) => (
                <SelectItem key={value} value={value}>
                  {labels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <UploadIcon />
            Unggah berkas
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={FILE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void add(file, category);
            }}
          />
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG atau XLSX, maksimal 10 MB. Foto dikompres otomatis.
          </p>
        </div>
      ) : null}

      {attachments.length === 0 && items.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada berkas</EmptyTitle>
            <EmptyDescription>
              {canManage ? "Pilih kategori lalu unggah berkas." : "Berkas yang diunggah akan tampil di sini."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Nama berkas</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Diunggah</TableHead>
              {canManage ? <TableHead><span className="sr-only">Tindakan</span></TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.key}>
                <TableCell>
                  <Badge variant="outline">{labels[item.category]}</Badge>
                </TableCell>
                <TableCell className="max-w-64 truncate">{item.file.name}</TableCell>
                <TableCell>{formatFileSize(item.file.size)}</TableCell>
                <TableCell>
                  {item.status === "failed" ? (
                    <span className="text-sm text-destructive">{item.error}</span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2Icon className="animate-spin" />
                      {item.status === "preparing" ? "Mengompres…" : "Mengunggah…"}
                    </span>
                  )}
                </TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    {item.status === "failed" ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => retry(item.key)}>
                          <RotateCwIcon />
                          Coba lagi
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Batalkan unggahan"
                          onClick={() => dismiss(item.key)}
                        >
                          <XIcon />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {attachments.map((attachment) => (
              <TableRow key={attachment.id}>
                <TableCell>
                  <Badge variant="outline">{labels[attachment.category] ?? attachment.category}</Badge>
                </TableCell>
                <TableCell className="max-w-64">
                  <Button asChild variant="link" className="h-auto max-w-full justify-start p-0">
                    <a href={`/api/attachments/${attachment.id}`} target="_blank" rel="noreferrer">
                      <FileTextIcon />
                      <span className="truncate">{attachment.file_name}</span>
                    </a>
                  </Button>
                </TableCell>
                <TableCell>{formatFileSize(attachment.size_bytes)}</TableCell>
                <TableCell>{formatDateTime(attachment.created_at)}</TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus ${attachment.file_name}`}
                      onClick={() => {
                        setDeleteTarget(attachment);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus berkas?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.file_name} (${labels[deleteTarget.category] ?? deleteTarget.category}) dihapus permanen.`
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
