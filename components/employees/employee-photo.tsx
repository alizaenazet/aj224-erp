"use client";

import { CameraIcon, Loader2Icon, RotateCwIcon } from "lucide-react";
import { useRef } from "react";
import { useAttachmentUpload } from "@/components/attachments/use-attachment-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PHOTO_ACCEPT } from "@/lib/attachments/config";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type EmployeePhotoProps = {
  employeeId: string;
  name: string;
  photoUrl: string | null;
  canManage: boolean;
};

/** Employee photo (HCM-01), compressed to ≤ 1 MB before upload. */
export function EmployeePhoto({ employeeId, name, photoUrl, canManage }: EmployeePhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, add, retry } = useAttachmentUpload({ entityType: "employee", entityId: employeeId });
  const current = items[items.length - 1];

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="size-28">
        {photoUrl ? <AvatarImage src={photoUrl} alt={`Foto ${name}`} className="object-cover" /> : null}
        <AvatarFallback className="text-2xl">{initials(name)}</AvatarFallback>
      </Avatar>
      {canManage ? (
        <>
          {current?.status === "failed" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-destructive">{current.error}</p>
              <Button variant="outline" size="sm" onClick={() => retry(current.key)}>
                <RotateCwIcon />
                Coba lagi
              </Button>
            </div>
          ) : current ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="animate-spin" />
              {current.status === "preparing" ? "Mengompres foto…" : "Mengunggah foto…"}
            </p>
          ) : (
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <CameraIcon />
              {photoUrl ? "Ganti foto" : "Unggah foto"}
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void add(file, "photo");
            }}
          />
        </>
      ) : null}
    </div>
  );
}
