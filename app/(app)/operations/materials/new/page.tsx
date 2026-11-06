import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { MaterialForm } from "@/components/materials/material-form";
import { requireRole } from "@/lib/auth/session";
import { MATERIAL_MANAGE_ROLES } from "@/lib/materials/labels";
import { materialFormOptions } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Tambah Material" };

export default function NewMaterialPage() {
  return (
    <>
      <PageHeader title="Tambah Material" />
      <Suspense fallback={<ContentSkeleton />}>
        <NewMaterialContent />
      </Suspense>
    </>
  );
}

async function NewMaterialContent() {
  const profile = await requireRole(MATERIAL_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const options = await materialFormOptions();
  return <MaterialForm categories={options.categories} units={options.units} locations={options.locations} />;
}
