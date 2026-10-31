"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { id as dayPickerId } from "react-day-picker/locale";
import { useListParams } from "@/components/data-table/use-list-params";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format";

const toParam = (date: Date) => format(date, "yyyy-MM-dd");
const label = (date: Date) => formatDate(toParam(date));

function fromParam(value: string | null) {
  if (!value) return undefined;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Whole-day date range filter writing `from` / `to` (yyyy-mm-dd, WIB days). */
export function DateRangeFilter({ placeholder = "Rentang tanggal" }: { placeholder?: string }) {
  const { get, update } = useListParams();
  const [open, setOpen] = useState(false);
  const from = fromParam(get("from"));
  const to = fromParam(get("to"));
  const [draft, setDraft] = useState<DateRange | undefined>(
    from ? { from, to } : undefined,
  );

  const buttonLabel = from
    ? to && toParam(to) !== toParam(from)
      ? `${label(from)} – ${label(to)}`
      : label(from)
    : placeholder;

  function apply(range: DateRange | undefined) {
    update({
      from: range?.from ? toParam(range.from) : null,
      to: range?.from ? toParam(range.to ?? range.from) : null,
    });
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(from ? { from, to } : undefined);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal sm:w-auto">
          <CalendarIcon />
          {buttonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={dayPickerId}
          selected={draft}
          onSelect={setDraft}
          defaultMonth={draft?.from}
          numberOfMonths={1}
        />
        <div className="flex justify-end gap-2 border-t p-2">
          <Button variant="ghost" size="sm" onClick={() => apply(undefined)}>
            Hapus
          </Button>
          <Button size="sm" disabled={!draft?.from} onClick={() => apply(draft)}>
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
