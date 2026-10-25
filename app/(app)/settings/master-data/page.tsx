import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { MASTER_ENTITIES, MASTER_TABS } from "@/lib/master-data/entities";

export const metadata: Metadata = { title: "Master Data" };

const STAGE_DESCRIPTION = "Tahapan stringing dan bobot default untuk progres seksi.";

export default function MasterDataIndexPage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <MasterDataIndex />
    </Suspense>
  );
}

async function MasterDataIndex() {
  const profile = await requireProfile();
  const tabs = MASTER_TABS.filter((tab) => hasAnyRole(profile.role, tab.viewRoles));
  if (tabs.length === 0) return <AccessDenied />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tabs.map((tab) => (
        <Link key={tab.key} href={`/settings/master-data/${tab.key}`} className="rounded-xl">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>{tab.title}</CardTitle>
              <CardDescription>
                {MASTER_ENTITIES[tab.key]?.description ?? STAGE_DESCRIPTION}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
