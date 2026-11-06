import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { NoteForm } from "@/components/equipment/note-form";
import { requireRole } from "@/lib/auth/session";
import { allStock, locationOptions } from "@/lib/equipment/queries";
import { todayWib } from "@/lib/format";
import { allMaterialStock } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Buat Surat Jalan" };

export default function NewDeliveryNotePage() {
  return (
    <>
      <PageHeader title="Buat Surat Jalan" description="Stok lokasi asal berkurang saat surat jalan dikirim." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewDeliveryNoteContent />
      </Suspense>
    </>
  );
}

async function NewDeliveryNoteContent() {
  const profile = await requireRole(["operations"]);
  if (!profile) return <AccessDenied />;
  const [locations, stock, materialStock] = await Promise.all([locationOptions(), allStock(), allMaterialStock()]);
  return <NoteForm locations={locations} stock={stock} materialStock={materialStock} today={todayWib()} />;
}
