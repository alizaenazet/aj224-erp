import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { MaterialForm } from "@/components/materials/material-form";
import { requireRole } from "@/lib/auth/session";
import { MATERIAL_MANAGE_ROLES } from "@/lib/materials/labels";
import { getMaterial, materialFormOptions } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Ubah Material" };

type Params = Promise<{ id: string }>;

export default function EditMaterialPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader title="Ubah Material" />
      <Suspense fallback={<ContentSkeleton />}>
        <EditMaterialContent params={params} />
      </Suspense>
    </>
  );
}

async function EditMaterialContent({ params }: { params: Params }) {
  const profile = await requireRole(MATERIAL_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const [material, options] = await Promise.all([getMaterial((await params).id), materialFormOptions()]);
  if (!material) notFound();
  return (
    <MaterialForm
      materialId={material.id}
      isActive={material.is_active}
      defaultValues={{
        code: material.code,
        name: material.name,
        unit_code: material.unit_code,
        category_id: material.category_id,
        ownership: material.ownership,
        min_stock: material.min_stock,
        notes: material.notes,
      }}
      categories={options.categories}
      units={options.units}
      locations={options.locations}
    />
  );
}
