import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { OpnameForm } from "@/components/materials/opname-form";
import { requireRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { MATERIAL_MANAGE_ROLES } from "@/lib/materials/labels";
import { materialFormOptions, transactionFormData } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Stok Opname" };

export default function OpnamePage() {
  return (
    <>
      <PageHeader title="Stok Opname" description="Penyesuaian stok berdasarkan hitung fisik; selisih tercatat di log audit." />
      <Suspense fallback={<ContentSkeleton />}>
        <OpnameContent />
      </Suspense>
    </>
  );
}

async function OpnameContent() {
  const profile = await requireRole(MATERIAL_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const [options, data] = await Promise.all([materialFormOptions(), transactionFormData(profile.role)]);
  return <OpnameForm locations={options.locations} materials={data.materials} stock={data.stock} today={todayWib()} />;
}
