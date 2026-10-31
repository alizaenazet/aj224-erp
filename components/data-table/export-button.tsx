"use client";

import { DownloadIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Downloads the list as .xlsx with the active search and filters (UMM-04);
 * `params` adds fixed parameters such as the project of a tab.
 */
export function ExportButton({ exportKey, params: extra }: { exportKey: string; params?: Record<string, string> }) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  for (const [key, value] of Object.entries(extra ?? {})) params.set(key, value);
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
