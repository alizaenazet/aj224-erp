"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Route-based tabs for the master-data lists the role may open. */
export function MasterDataTabs({ tabs }: { tabs: { key: string; title: string }[] }) {
  const pathname = usePathname();
  const active = pathname.split("/")[3] ?? "";

  if (!active) return null;

  return (
    <ScrollArea className="w-full">
      <Tabs value={active}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} asChild>
              <Link href={`/settings/master-data/${tab.key}`}>{tab.title}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
