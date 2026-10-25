"use client";

import { CheckIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { EmployeeOption } from "@/lib/trainings/labels";

type EmployeeMultiPickerProps = {
  employees: EmployeeOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Employees that may not be picked (e.g. already participants). */
  excluded?: string[];
  label?: string;
};

/** Searchable multi-select of active employees (Popover + Command). */
export function EmployeeMultiPicker({
  employees,
  selected,
  onChange,
  excluded = [],
  label = "Pilih peserta",
}: EmployeeMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const chosen = new Set(selected);
  const options = employees.filter((employee) => !excluded.includes(employee.id));

  function toggle(id: string) {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <UserPlusIcon />
          {label}
          {selected.length ? ` (${selected.length})` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari nama atau NIK karyawan" />
          <CommandList>
            <CommandEmpty>Tidak ada karyawan aktif yang cocok.</CommandEmpty>
            <CommandGroup>
              {options.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.full_name} ${employee.employee_no}`}
                  onSelect={() => toggle(employee.id)}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{employee.full_name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {employee.employee_no}
                      {employee.position ? ` · ${employee.position}` : ""}
                    </span>
                  </div>
                  {chosen.has(employee.id) ? <CheckIcon /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
