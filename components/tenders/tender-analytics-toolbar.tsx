"use client";

import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";

/** Period by closing date; without a range the page uses this year. */
export function TenderAnalyticsToolbar({ defaultLabel }: { defaultLabel: string }) {
  return <DataTableToolbar filters={<DateRangeFilter placeholder={defaultLabel} />} />;
}
