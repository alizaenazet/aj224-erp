import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { StageTemplateEditor } from "@/components/master-data/stage-template-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { MASTER_TABS, STAGE_MANAGE_ROLES } from "@/lib/master-data/entities";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tahapan Stringing" };

const VIEW_ROLES = MASTER_TABS.find((tab) => tab.key === "stages")!.viewRoles;

export default function StagesPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <StagesContent />
    </Suspense>
  );
}

async function StagesContent() {
  const profile = await requireRole(VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stage_templates")
    .select("id, name, default_weight, is_active")
    .order("sort_order")
    .order("name");

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Template tahapan gagal dimuat. Muat ulang halaman.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Tahapan stringing dan bobot default. Setiap seksi proyek memakai template ini dan
        dapat disesuaikan per proyek. Total bobot tahapan aktif harus 100.
      </p>
      <StageTemplateEditor
        stages={(data ?? []).map((stage) => ({ ...stage, default_weight: Number(stage.default_weight) }))}
        canManage={hasAnyRole(profile.role, STAGE_MANAGE_ROLES)}
      />
    </div>
  );
}
