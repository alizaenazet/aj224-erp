"use client";

import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setCompanyLogo } from "@/lib/company/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Uploads the company logo to private storage (MST-02, UMM-03). */
export function LogoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    const extension = TYPES[file.type];
    if (!extension) {
      toast.error("Logo harus berupa PNG, JPG, atau WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ukuran logo maksimal 1 MB.");
      return;
    }

    setPending(true);
    const path = `logo/${Date.now()}.${extension}`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      setPending(false);
      toast.error("Logo gagal diunggah. Coba lagi.");
      return;
    }

    const result = await setCompanyLogo(path);
    setPending(false);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label="Pilih berkas logo"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button variant="outline" disabled={pending} onClick={() => inputRef.current?.click()}>
        <UploadIcon />
        {pending ? "Mengunggah…" : "Unggah logo"}
      </Button>
    </>
  );
}
