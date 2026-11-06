// Display formats for Bahasa Indonesia (PRD §14): Rp without decimals,
// "25 Okt 2026" dates, decimal comma, WIB time zone.

const TIME_ZONE = "Asia/Jakarta";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Rp 1.250.000" */
export function formatRupiah(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return rupiahFormatter.format(value).replace(/ /g, " ");
}

/** "Rp 18,3 M", "Rp 6 jt": for narrow places (phone dashboards). */
export function formatRupiahShort(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const units: [number, string][] = [[1e12, "T"], [1e9, "M"], [1e6, "jt"], [1e3, "rb"]];
  const [size, unit] = units.find(([limit]) => Math.abs(value) >= limit) ?? [1, ""];
  const amount = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value / size);
  return `Rp ${amount}${unit ? ` ${unit}` : ""}`;
}

/** "4,2" — decimal comma, thousands dot. */
export function formatNumber(value: number | null | undefined, fractionDigits = 0) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** "25 Okt 2026" */
export function formatDate(value: DateInput) {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "—";
}

/** "25 Okt 2026, 14.05" (WIB) */
export function formatDateTime(value: DateInput) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

/** Today's date in WIB as yyyy-mm-dd (for date limits such as "not after today"). */
export function todayWib() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function spell(value: number): string {
  if (value < 12) return SATUAN[value];
  if (value < 20) return `${spell(value - 10)} belas`;
  if (value < 100) return `${spell(Math.floor(value / 10))} puluh ${spell(value % 10)}`.trim();
  if (value < 200) return `seratus ${spell(value - 100)}`.trim();
  if (value < 1000) return `${spell(Math.floor(value / 100))} ratus ${spell(value % 100)}`.trim();
  if (value < 2000) return `seribu ${spell(value - 1000)}`.trim();
  const scales: [number, string][] = [
    [1_000_000_000_000, "triliun"],
    [1_000_000_000, "miliar"],
    [1_000_000, "juta"],
    [1000, "ribu"],
  ];
  for (const [size, word] of scales) {
    if (value >= size) return `${spell(Math.floor(value / size))} ${word} ${spell(value % size)}`.trim();
  }
  return "";
}

/** Amount in Indonesian words for invoices and receipts: 444000000 → "empat ratus empat puluh empat juta rupiah". */
export function terbilang(value: number | null | undefined) {
  const amount = Math.round(Math.abs(Number(value ?? 0)));
  const words = amount === 0 ? "nol" : spell(amount).replace(/\s+/g, " ");
  return `${words} rupiah`;
}
