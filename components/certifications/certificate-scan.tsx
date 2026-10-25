"use client";

import { FileTextIcon, Loader2Icon, RotateCwIcon, UploadIcon } from "lucide-react";
import { useRef } from "react";
import { useAttachmentUpload } from "@/components/attachments/use-attachment-upload";
import { Button } from "@/components/ui/button";
import { SCAN_ACCEPT } from "@/lib/attachments/config";

type CertificateScanProps = {
  certificateId: string;
  /** Attachment id of the scan, when there is one. */
  scanId: string | null;
  canManage: boolean;
};

/** Scan of one certificate: open it, or upload/replace it (HCM). */
export function CertificateScan({ certificateId, scanId, canManage }: CertificateScanProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, add, retry } = useAttachmentUpload({
    entityType: "employee_certificate",
    entityId: certificateId,
  });
  const current = items[items.length - 1];

  if (current?.status === "failed") {
    return (
      <Button variant="outline" size="sm" onClick={() => retry(current.key)} title={current.error}>
        <RotateCwIcon />
        Coba lagi
      </Button>
    );
  }
  if (current) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="animate-spin" />
        Mengunggah…
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {scanId ? (
        <Button asChild variant="link" size="sm" className="px-0">
          <a href={`/api/attachments/${scanId}`} target="_blank" rel="noreferrer">
            <FileTextIcon />
            Lihat
          </a>
        </Button>
      ) : canManage ? null : (
        <span className="text-muted-foreground">—</span>
      )}
      {canManage ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            aria-label={scanId ? "Ganti scan sertifikat" : "Unggah scan sertifikat"}
          >
            <UploadIcon />
            {scanId ? "Ganti" : "Unggah"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={SCAN_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void add(file, "scan");
            }}
          />
        </>
      ) : null}
    </div>
  );
}
