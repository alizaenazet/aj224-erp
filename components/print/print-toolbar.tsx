"use client";

import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Screen-only actions above a printable document (hidden on paper). */
export function PrintToolbar() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-2 print:hidden">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeftIcon />
        Kembali
      </Button>
      <Button onClick={() => window.print()}>
        <PrinterIcon />
        Cetak
      </Button>
    </div>
  );
}
