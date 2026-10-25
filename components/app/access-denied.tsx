import Link from "next/link";
import { ShieldXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** Shown when the signed-in role may not open a page (PRD §13, UMM-02). */
export function AccessDenied() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldXIcon />
        </EmptyMedia>
        <EmptyTitle>Akses ditolak</EmptyTitle>
        <EmptyDescription>
          Peran Anda tidak memiliki akses ke halaman ini. Hubungi Super Admin
          bila Anda memerlukan akses.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
