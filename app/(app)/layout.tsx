import { Suspense } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { NavUser } from "@/components/app/nav-user";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { NotificationBellLoader } from "@/components/notifications/notification-bell-loader";
import { Separator } from "@/components/ui/separator";
import {
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireProfile } from "@/lib/auth/session";

// Pages render outside the sidebar's Suspense boundary so navigation never
// waits on the shell's data; each page loads its own data behind loading.tsx.
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar>
        <Suspense fallback={<SidebarNavSkeleton />}>
          <SidebarNavLoader />
        </Suspense>
      </AppSidebar>
      {/* min-w-0: wide tables scroll inside their container, not the page. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">AJ224 ERP</span>
          <div className="ml-auto">
            <Suspense fallback={<Skeleton className="size-8" />}>
              <NotificationBellLoader />
            </Suspense>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function SidebarNavLoader() {
  const profile = await requireProfile();

  return (
    <>
      <SidebarNav role={profile.role} />
      <SidebarFooter>
        <NavUser
          fullName={profile.full_name}
          email={profile.email}
          role={profile.role}
        />
      </SidebarFooter>
    </>
  );
}

function SidebarNavSkeleton() {
  return (
    <SidebarContent>
      <div className="flex flex-col gap-2 p-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </SidebarContent>
  );
}
