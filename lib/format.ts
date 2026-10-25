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
