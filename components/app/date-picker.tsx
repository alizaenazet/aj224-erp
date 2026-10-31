"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { id as dayPickerId } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format";

function toDate(value: string | null | undefined) {
  if (!value) return undefined;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

type DatePickerProps = {
  id?: string;
  /** yyyy-MM-dd or null. */
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Latest selectable date (yyyy-MM-dd). */
  max?: string;
  /** Earliest selectable date (yyyy-MM-dd). */
  min?: string;
  /** Offer "Hapus" to clear an optional date. */
  clearable?: boolean;
  invalid?: boolean;
  disabled?: boolean;
};

/** Single date field ("25 Okt 2026") writing yyyy-MM-dd. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  max,
  min,
  clearable = false,
  invalid,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const maxDate = toDate(max);
  const minDate = toDate(min);
  const thisYear = new Date().getFullYear();

  const disabledDays = [
    ...(maxDate ? [{ after: maxDate }] : []),
    ...(minDate ? [{ before: minDate }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
          data-empty={!selected}
        >
          <CalendarIcon />
          {selected ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={dayPickerId}
          captionLayout="dropdown"
          startMonth={new Date(1950, 0)}
          // Certificates and contracts run years ahead.
          endMonth={maxDate ?? new Date(thisYear + 30, 11)}
          selected={selected}
          defaultMonth={selected ?? maxDate}
          disabled={disabledDays}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
        />
        {clearable && selected ? (
          <div className="flex justify-end border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Hapus
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
