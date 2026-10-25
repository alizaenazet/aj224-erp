import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { Letterhead } from "@/components/print/letterhead";
import { PrintPage } from "@/components/print/print-page";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Pratinjau Kop Surat" };

export default function LetterheadPreviewPage() {
  return (
    <>
      <PrintToolbar />
      <Suspense fallback={<ContentSkeleton />}>
        <LetterheadPreview />
      </Suspense>
    </>
  );
}

async function LetterheadPreview() {
  const profile = await requireRole(["super_admin", "director"]);
  if (!profile) return <AccessDenied />;

  return (
    <PrintPage>
      <Letterhead />
      <section className="flex flex-col gap-2 text-sm">
        <h1 className="text-lg font-semibold">Pratinjau kop surat</h1>
        <p>
          Kop ini dipakai pada Invoice, Surat Jalan, Slip Gaji, Laporan Harian, dan Laporan
          Insiden. Pilih &ldquo;Cetak&rdquo;, lalu &ldquo;Simpan sebagai PDF&rdquo; di dialog
          cetak untuk menyimpan dokumen.
        </p>
      </section>
    </PrintPage>
  );
}
