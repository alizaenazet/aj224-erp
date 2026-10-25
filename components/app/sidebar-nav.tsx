"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AppRole } from "@/lib/auth/roles";
import { isNavItemActive, navForRole } from "@/lib/navigation";

/** Menu groups the role may open (PRD §9, §13). */
export function SidebarNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const groups = navForRole(role);

  return (
    <SidebarContent>
      {groups.map((group) => (
        <SidebarGroup key={group.label ?? "top"}>
          {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isNavItemActive(pathname, item.href)}
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
