import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TenderForm } from "@/components/tenders/tender-form";
import { requireRole } from "@/lib/auth/session";
import { clientOptions } from "@/lib/clients/queries";
import { getTender, picOptions } from "@/lib/tenders/queries";

export const metadata: Metadata = { title: "Ubah Tender" };

type Params = Promise<{ id: string }>;

export default function EditTenderPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <EditTenderContent params={params} />
    </Suspense>
  );
}

async function EditTenderContent({ params }: { params: Params }) {
  const profile = await requireRole(["marketing"]);
  if (!profile) return <AccessDenied />;

  const tender = await getTender((await params).id);
  if (!tender) notFound();
  const [clients, pics] = await Promise.all([clientOptions({ includeId: tender.client_id }), picOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Ubah ${tender.name}`} description="Kolom bertanda * wajib diisi." />
      <TenderForm
        tenderId={tender.id}
        clients={clients}
        pics={pics}
        defaultValues={{
          name: tender.name,
          client_id: tender.client_id,
          end_owner: tender.end_owner,
          location: tender.location,
          voltage_kv: tender.voltage_kv as 150 | 275 | 500 | null,
          length_kms: tender.length_kms,
          tower_count: tender.tower_count,
          scope: tender.scope,
          info_date: tender.info_date,
          bid_deadline: tender.bid_deadline,
          bid_value: tender.bid_value,
          estimated_cost: tender.estimated_cost,
          pic_id: tender.pic_id,
          win_probability: tender.win_probability,
          notes: tender.notes,
        }}
      />
    </div>
  );
}
