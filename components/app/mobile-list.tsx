import { cn } from "cn";
import { Item, ItemFooter, ItemGroup, ItemHeader } from "@/components/ui/item";

export type MobileField = {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
  /** Long text (description, chronology) takes the full width. */
  full?: boolean;
};

export type MobileRow = {
  key: string;
  title: React.ReactNode;
  /** Shown at the right of the title, usually the status badge. */
  aside?: React.ReactNode;
  fields: MobileField[];
  actions?: React.ReactNode;
};

/**
 * Phone layout of a table (below md): one outlined item per row with the
 * title on top and the other columns as label/value pairs. Pair it with the
 * table wrapped in `hidden md:block`.
 */
export function MobileList({ rows, className }: { rows: MobileRow[]; className?: string }) {
  return (
    <ItemGroup className={cn("gap-2 md:hidden", className)}>
      {rows.map((row) => (
        <Item key={row.key} variant="outline" size="sm" className="items-start">
          <ItemHeader className="items-start">
            <div className="flex min-w-0 flex-col gap-0.5 font-medium">{row.title}</div>
            {row.aside ? <div className="flex shrink-0 flex-wrap justify-end gap-1">{row.aside}</div> : null}
          </ItemHeader>
          {row.fields.length ? (
            <dl className="grid basis-full grid-cols-2 gap-x-4 gap-y-2">
              {row.fields.map((field) => (
                <div key={field.key} className={cn("flex min-w-0 flex-col gap-0.5", field.full && "col-span-2")}>
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  {/* Table cells keep values on one line; a card has room to wrap them. */}
                  <dd className="min-w-0 break-words [&_*]:whitespace-normal">{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {row.actions ? <ItemFooter className="justify-end">{row.actions}</ItemFooter> : null}
        </Item>
      ))}
    </ItemGroup>
  );
}
