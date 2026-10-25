import { z } from "zod";

// Nullable input too: the form resolver already turns "" into null before the
// server action re-validates the same schema.
const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter.`)
    .nullable()
    .transform((value) => (value ? value : null));

export const companyProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama perusahaan wajib diisi.").max(120, "Nama maksimal 120 karakter."),
  address: optionalText("Alamat", 300),
  phone: optionalText("Telepon", 30),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value === "" || z.email().safeParse(value).success, "Format email tidak valid.")
    .nullable()
    .transform((value) => (value ? value : null)),
  npwp: optionalText("NPWP", 30),
  is_pkp: z.boolean(),
});

export type CompanyProfileInput = z.input<typeof companyProfileSchema>;

export const bankAccountSchema = z.object({
  bank_name: z.string().trim().min(1, "Nama bank wajib diisi.").max(60),
  account_number: z.string().trim().min(1, "Nomor rekening wajib diisi.").max(40),
  account_holder: z.string().trim().min(1, "Nama pemilik rekening wajib diisi.").max(100),
});

export type BankAccountInput = z.input<typeof bankAccountSchema>;
