"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ComboboxOption = { value: string; label: string; description?: string };

type ComboboxProps = {
  id?: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  disabled?: boolean;
};

/** Searchable single choice (Popover + Command) for long lists such as employees and projects. */
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Cari…",
  emptyText = "Tidak ada yang cocok.",
  invalid,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {/* w-0 + flex-1: a long label must not widen the field (phone forms). */}
          <span className={selected ? "w-0 flex-1 truncate text-left" : "w-0 flex-1 truncate text-left text-muted-foreground"}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.description ?? ""}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span className="truncate text-xs text-muted-foreground">{option.description}</span>
                    ) : null}
                  </div>
                  <CheckIcon className={option.value === value ? "ml-auto" : "ml-auto opacity-0"} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
