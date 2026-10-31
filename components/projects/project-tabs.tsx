"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ProjectTab = { segment: string; label: string };

/** Project page tabs as links (PRD §9); later modules append their tabs. */
export function ProjectTabs({ projectId, tabs }: { projectId: string; tabs: ProjectTab[] }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const active =
    tabs.find((tab) => tab.segment && pathname.startsWith(`${base}/${tab.segment}`))?.segment ?? "";

  return (
    <Tabs value={active}>
      <TabsList className="max-w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.segment || "summary"} value={tab.segment} asChild>
            <Link href={tab.segment ? `${base}/${tab.segment}` : base}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
