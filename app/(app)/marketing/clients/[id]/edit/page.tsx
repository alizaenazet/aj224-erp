import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { requireRole } from "@/lib/auth/session";
import { CLIENT_MANAGE_ROLES } from "@/lib/clients/labels";
import { getClient } from "@/lib/clients/queries";

export const metadata: Metadata = { title: "Ubah Klien" };

type Params = Promise<{ id: string }>;

export default function EditClientPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <EditClientContent params={params} />
    </Suspense>
  );
}

async function EditClientContent({ params }: { params: Params }) {
  const profile = await requireRole(CLIENT_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;

  const client = await getClient((await params).id);
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Ubah ${client.name}`} description="Kolom bertanda * wajib diisi." />
      <ClientForm
        clientId={client.id}
        defaultValues={{
          name: client.name,
          kind: client.kind,
          address: client.address,
          npwp: client.npwp,
          payment_term_days: client.payment_term_days,
          notes: client.notes,
          is_active: client.is_active,
        }}
      />
    </div>
  );
}
