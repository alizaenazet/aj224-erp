"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

type RupiahInputProps = {
  id?: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  invalid?: boolean;
  placeholder?: string;
};

/** Whole-Rupiah amount with an "Rp" prefix; empty means null. */
export function RupiahInput({ id, value, onChange, onBlur, invalid, placeholder = "0" }: RupiahInputProps) {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>Rp</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        placeholder={placeholder}
        aria-invalid={invalid}
        value={value ?? ""}
        onBlur={onBlur}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
      />
    </InputGroup>
  );
}
