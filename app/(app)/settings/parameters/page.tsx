import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { DocumentFormats, type DocumentType } from "@/components/parameters/document-formats";
import { ParametersForm } from "@/components/parameters/parameters-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Parameter Sistem" };

export default function ParametersPage() {
  return (
    <>
      <PageHeader
        title="Parameter Sistem"
        description="Angka acuan aturan bisnis. Setiap perubahan tercatat di log audit."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <ParametersContent />
      </Suspense>
    </>
  );
}

async function ParametersContent() {
  const profile = await requireRole(["super_admin", "director"]);
  if (!profile) return <AccessDenied />;

  const canEdit = profile.role === "super_admin";
  const supabase = await createClient();
  const [{ data: params }, { data: types }] = await Promise.all([
    supabase
      .from("system_parameters")
      .select(
        "backdate_days, cert_expiry_warning_days, health_warning_points, health_critical_points, ppn_rate, standard_work_hours, monthly_salary_divisor",
      )
      .maybeSingle(),
    supabase.from("document_types").select("code, label, format, reset_period").order("label"),
  ]);

  if (!params) return null;

  const values = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Number(value)]),
  ) as Parameters<typeof ParametersForm>[0]["values"];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Aturan bisnis</CardTitle>
          <CardDescription>
            {canEdit ? "Nilai di luar batas akan ditolak." : "Hanya Super Admin yang dapat mengubah."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParametersForm values={values} canEdit={canEdit} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Format nomor dokumen</CardTitle>
          <CardDescription>Nomor dibuat otomatis saat dokumen disimpan dan tidak pernah ganda.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentFormats types={(types ?? []) as DocumentType[]} canEdit={canEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
