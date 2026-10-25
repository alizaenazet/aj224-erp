import { z } from "zod";
import type { MasterField } from "@/lib/master-data/entities";

const emptyToNull = (value: unknown) =>
  value === "" || value === undefined || value === null ? null : value;

function textSchema(field: MasterField) {
  let schema = z.string().trim();
  if (field.transform === "upper") schema = schema.toUpperCase();
  if (field.transform === "lower") schema = schema.toLowerCase();
  if (field.maxLength) {
    schema = schema.max(field.maxLength, `${field.label} maksimal ${field.maxLength} karakter.`);
  }

  if (field.required) {
    let required = schema.min(1, `${field.label} wajib diisi.`);
    if (field.type === "email") required = required.pipe(z.email(`Format ${field.label} tidak valid.`)) as never;
    if (field.pattern) required = required.regex(field.pattern.regex, field.pattern.message);
    return required;
  }

  return z.preprocess(
    emptyToNull,
    z.union([
      z.null(),
      field.type === "email"
        ? schema.pipe(z.email(`Format ${field.label} tidak valid.`))
        : field.pattern
          ? schema.regex(field.pattern.regex, field.pattern.message)
          : schema,
    ]),
  );
}

function numberSchema(field: MasterField) {
  let schema = z.number({ error: `${field.label} harus angka.` }).int(`${field.label} harus bilangan bulat.`);
  if (field.min !== undefined) schema = schema.min(field.min, `${field.label} minimal ${field.min}.`);
  if (field.max !== undefined) schema = schema.max(field.max, `${field.label} maksimal ${field.max}.`);

  return z.preprocess(
    (value) => {
      const empty = emptyToNull(value);
      return empty === null ? null : Number(empty);
    },
    field.required
      ? schema.nullable().refine((value) => value !== null, `${field.label} wajib diisi.`)
      : schema.nullable(),
  );
}

/** Zod schema for a master record form, shared by the form and the action. */
export function buildMasterSchema(fields: MasterField[], mode: "create" | "edit") {
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    if (mode === "edit" && field.editable === false) continue;

    switch (field.type) {
      case "text":
      case "email":
      case "textarea":
        shape[field.name] = textSchema(field);
        break;
      case "number":
        shape[field.name] = numberSchema(field);
        break;
      case "select": {
        const values = (field.options ?? []).map((option) => option.value) as [string, ...string[]];
        const choice = z.enum(values, `Pilih ${field.label.toLowerCase()}.`);
        shape[field.name] = field.required ? choice : z.preprocess(emptyToNull, choice.nullable());
        break;
      }
      case "switch":
        shape[field.name] = z.boolean();
        break;
      case "certificates":
        shape[field.name] = z.array(z.uuid());
        break;
    }
  }

  return z.object(shape);
}

/** Initial form values for a new record or from an existing row. */
export function initialValues(fields: MasterField[], row: Record<string, unknown> | null) {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "certificates") {
      const links = (row?.position_required_certificates ?? []) as { certificate_type_id: string }[];
      values[field.name] = links.map((link) => link.certificate_type_id);
      continue;
    }
    const value = row ? row[field.name] : field.defaultValue;
    if (field.type === "switch") values[field.name] = Boolean(value ?? false);
    else values[field.name] = value === null || value === undefined ? "" : String(value);
  }
  return values;
}
