import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { MasterDataTabs } from "@/components/master-data/master-data-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { MASTER_TABS } from "@/lib/master-data/entities";

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Master Data"
        description="Data acuan yang dipakai di seluruh modul."
      />
      <Suspense fallback={<Skeleton className="h-9 w-full max-w-xl" />}>
        <TabsLoader />
      </Suspense>
      {children}
    </>
  );
}

async function TabsLoader() {
  const profile = await requireProfile();
  const tabs = MASTER_TABS.filter((tab) => hasAnyRole(profile.role, tab.viewRoles)).map(
    ({ key, title }) => ({ key, title }),
  );
  return <MasterDataTabs tabs={tabs} />;
}
