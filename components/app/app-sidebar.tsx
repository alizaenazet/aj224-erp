"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Sidebar frame. The role-dependent menu and user footer are passed in as
 * children (loaded on the server inside Suspense) so the frame itself
 * hydrates together with SidebarProvider.
 */
export function AppSidebar({ children }: { children: React.ReactNode }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" onClick={() => setOpenMobile(false)}>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">AJ224 ERP</span>
                  <span className="truncate text-xs text-muted-foreground">
                    UD. AJ224
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {children}
      <SidebarRail />
    </Sidebar>
  );
}
