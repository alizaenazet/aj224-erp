"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ProjectTab = { segment: string; label: string };

const SUMMARY = "__summary__";

/**
 * Project page tabs as links (PRD §9); later modules append their tabs. On
 * phones the ten tabs become one dropdown instead of a sideways scroll.
 */
export function ProjectTabs({ projectId, tabs }: { projectId: string; tabs: ProjectTab[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/projects/${projectId}`;
  const active =
    tabs.find((tab) => tab.segment && pathname.startsWith(`${base}/${tab.segment}`))?.segment ?? "";
  const href = (segment: string) => (segment ? `${base}/${segment}` : base);

  return (
    <>
      <Select value={active || SUMMARY} onValueChange={(value) => router.push(href(value === SUMMARY ? "" : value))}>
        <SelectTrigger className="w-full md:hidden" aria-label="Bagian proyek">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {tabs.map((tab) => (
            <SelectItem key={tab.segment || SUMMARY} value={tab.segment || SUMMARY}>
              {tab.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tabs value={active} className="hidden md:flex">
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.segment || "summary"} value={tab.segment} asChild>
              <Link href={href(tab.segment)}>{tab.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
}
