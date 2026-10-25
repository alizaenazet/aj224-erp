import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TenderForm } from "@/components/tenders/tender-form";
import { requireRole } from "@/lib/auth/session";
import { clientOptions } from "@/lib/clients/queries";
import { isUuid, parseText, type RawSearchParams } from "@/lib/list/params";
import { picOptions } from "@/lib/tenders/queries";

export const metadata: Metadata = { title: "Tambah Tender" };

type SearchParams = Promise<RawSearchParams>;

export default function NewTenderPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Tambah Tender" description="Kolom bertanda * wajib diisi." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewTenderContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewTenderContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(["marketing"]);
  if (!profile) return <AccessDenied />;

  const client = parseText((await searchParams).client);
  const [clients, pics] = await Promise.all([clientOptions(), picOptions()]);
  const clientId = isUuid(client) && clients.some((option) => option.value === client) ? client : undefined;

  return <TenderForm clients={clients} pics={pics} defaultValues={{ client_id: clientId, pic_id: profile.id }} />;
}
