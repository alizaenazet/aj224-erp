import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { ToolForm } from "@/components/equipment/tool-form";
import { requireRole } from "@/lib/auth/session";
import { toolFormOptions } from "@/lib/equipment/queries";

export const metadata: Metadata = { title: "Tambah Alat" };

export default function NewToolPage() {
  return (
    <>
      <PageHeader title="Tambah Alat" description="Kolom bertanda * wajib diisi." />
      <Suspense fallback={<ContentSkeleton />}>
        <NewToolContent />
      </Suspense>
    </>
  );
}

async function NewToolContent() {
  const profile = await requireRole(["operations"]);
  if (!profile) return <AccessDenied />;
  const options = await toolFormOptions();
  return <ToolForm categories={options.categories} suppliers={options.suppliers} locations={options.locations} />;
}
