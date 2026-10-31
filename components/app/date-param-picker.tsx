"use client";

import { DatePicker } from "@/components/app/date-picker";
import { useListParams } from "@/components/data-table/use-list-params";
import { Field, FieldLabel } from "@/components/ui/field";

/** A date kept in a URL parameter (e.g. the day shown on a tab). */
export function DateParamPicker({
  id,
  label,
  param = "date",
  value,
  max,
}: {
  id: string;
  label: string;
  param?: string;
  value: string;
  max?: string;
}) {
  const { update } = useListParams();
  return (
    <Field className="sm:w-48">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <DatePicker id={id} value={value} onChange={(next) => update({ [param]: next })} max={max} />
    </Field>
  );
}
