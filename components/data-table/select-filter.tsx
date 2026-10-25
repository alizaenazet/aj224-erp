"use client";

import { useListParams } from "@/components/data-table/use-list-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

type SelectFilterProps = {
  /** URL parameter this filter writes. */
  param: string;
  /** Label of the "no filter" option, e.g. "Semua peran". */
  allLabel: string;
  options: readonly { value: string; label: string }[];
};

/** One-choice filter bound to a URL parameter (UMM-09). */
export function SelectFilter({ param, allLabel, options }: SelectFilterProps) {
  const { get, update } = useListParams();
  const value = get(param);
  const valid = options.some((option) => option.value === value);

  return (
    <Select
      value={valid && value ? value : ALL}
      onValueChange={(next) => update({ [param]: next === ALL ? null : next })}
    >
      <SelectTrigger className="w-full sm:w-44" aria-label={allLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
