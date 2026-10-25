// Typed parsing of list URL parameters (search, filters, date range, sort,
// page). Lists keep their whole state in the URL (UMM-09).

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 50;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Trimmed free text, max 100 characters; null when empty. */
export function parseText(value: string | string[] | undefined) {
  const text = first(value)?.trim().slice(0, 100);
  return text ? text : null;
}

/** The value when it is one of the allowed options, else null. */
export function parseEnum<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | null {
  const text = first(value);
  return text && (allowed as readonly string[]).includes(text) ? (text as T) : null;
}

/** Positive integer page number, default 1. */
export function parsePage(value: string | string[] | undefined) {
  const page = Number(first(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export type DateRange = {
  from: string | null;
  to: string | null;
  /** Inclusive lower bound: start of `from` in WIB, as an ISO timestamp. */
  gte: string | null;
  /** Exclusive upper bound: start of the day after `to` in WIB. */
  lt: string | null;
};

/** Whole WIB days from `from` through `to` (yyyy-mm-dd). */
export function parseDateRange(params: RawSearchParams): DateRange {
  const from = first(params.from);
  const to = first(params.to);
  const validFrom = isValidDate(from) ? from : null;
  const validTo = isValidDate(to) ? to : null;

  return {
    from: validFrom,
    to: validTo,
    gte: validFrom ? new Date(`${validFrom}T00:00:00+07:00`).toISOString() : null,
    lt: validTo ? new Date(`${addDays(validTo, 1)}T00:00:00+07:00`).toISOString() : null,
  };
}

export type SortState<C extends string> = { column: C; ascending: boolean };

/** `column.asc|desc` restricted to allowed columns, else the fallback. */
export function parseSort<C extends string>(
  value: string | string[] | undefined,
  allowed: readonly C[],
  fallback: SortState<C>,
): SortState<C> {
  const [column, direction] = (first(value) ?? "").split(".");
  if (!(allowed as readonly string[]).includes(column)) return fallback;
  if (direction !== "asc" && direction !== "desc") return fallback;
  return { column: column as C, ascending: direction === "asc" };
}

/** Escapes `%`, `_` and `,` for PostgREST ilike / or() filters. */
export function likePattern(text: string) {
  return `%${text.replace(/[\\%_]/g, "\\$&").replace(/[,()]/g, " ")}%`;
}

/** Same params with a different page (page 1 drops the key). */
export function withPage(params: RawSearchParams, path: string, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = first(value);
    if (key !== "page" && v) search.set(key, v);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a UUID string (route ids, filter values). */
export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID.test(value);
}
