"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useListParams } from "@/components/data-table/use-list-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DataTableToolbarProps = {
  /** Placeholder for the search box; omit to hide search. */
  searchPlaceholder?: string;
  /** Filter controls (SelectFilter, DateRangeFilter). */
  filters?: React.ReactNode;
  /** Right-aligned actions such as ExportButton. */
  actions?: React.ReactNode;
};

/** Search, filters, reset and actions above a DataTable (UMM-09). */
export function DataTableToolbar({ searchPlaceholder, filters, actions }: DataTableToolbarProps) {
  const { get, update, reset, searchParams } = useListParams();
  const urlQuery = get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  // Keep the box in sync when the URL changes elsewhere (reset, back button).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // Debounced search: one navigation after typing stops.
  useEffect(() => {
    if (query === urlQuery) return;
    const timer = setTimeout(() => update({ q: query.trim() || null }), 300);
    return () => clearTimeout(timer);
  }, [query, urlQuery, update]);

  const hasActiveFilters = [...searchParams.keys()].some(
    (key) => key !== "page" && key !== "sort",
  );

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {searchPlaceholder ? (
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="pl-8"
            />
          </div>
        ) : null}
        {filters}
        {hasActiveFilters ? (
          <Button variant="ghost" onClick={reset}>
            <XIcon />
            Reset filter
          </Button>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
