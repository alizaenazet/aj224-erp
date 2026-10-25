import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { requireRole } from "@/lib/auth/session";
import { CLIENT_MANAGE_ROLES } from "@/lib/clients/labels";

export const metadata: Metadata = { title: "Tambah Klien" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="Tambah Klien" description="Kolom bertanda * wajib diisi." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewClientContent />
      </Suspense>
    </>
  );
}

async function NewClientContent() {
  const profile = await requireRole(CLIENT_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  return <ClientForm />;
}
