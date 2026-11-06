import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionGroup } from "@/lib/dashboard/queries";

/** One "Perlu Tindakan" list (DSB-04): up to five items, each linking to its action page. */
export function ActionList({ group }: { group: ActionGroup }) {
  const items = group.items.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {group.title}
          {group.items.length ? <Badge variant={group.items.some((item) => item.tone === "destructive") ? "destructive" : "warning"}>{group.items.length}</Badge> : null}
        </CardTitle>
        {group.items.length > items.length ? (
          <CardAction>
            <Link href={group.href} className="text-sm underline-offset-4 hover:underline">
              Lihat semua
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="flex flex-col divide-y">
            {items.map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <Link href={item.href} className="flex items-center justify-between gap-3 py-2 text-sm hover:underline">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{item.label}</span>
                    <span className="truncate text-muted-foreground">{item.detail}</span>
                  </span>
                  <ChevronRightIcon className="shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{group.empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
