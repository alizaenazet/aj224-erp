"use client";

import { DownloadIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Downloads the list as .xlsx with the active search and filters (UMM-04). */
export function ExportButton({ exportKey }: { exportKey: string }) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  const qs = params.toString();
  const href = `/api/export/${exportKey}${qs ? `?${qs}` : ""}`;

  return (
    <Button asChild variant="outline">
      <a href={href} download>
        <DownloadIcon />
        Ekspor Excel
      </a>
    </Button>
  );
}
