import { HardHatIcon } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

/** Shown to Lapangan users without an active assignment (UMM-02). */
export function NoAssignment() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HardHatIcon />
        </EmptyMedia>
        <EmptyTitle>Belum ada proyek yang ditugaskan</EmptyTitle>
        <EmptyDescription>
          Akses Anda mengikuti penugasan aktif. Hubungi HCM bila Anda seharusnya sudah ditugaskan di proyek.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
