import { formatRupiah, formatRupiahShort } from "@/lib/format";

/**
 * A Rupiah amount in a number tile: "Rp 10,5 M" on phones, where tiles sit
 * two per row, and the full "Rp 10.500.000.000" from sm up.
 */
export function MoneyValue({ value }: { value: number | null | undefined }) {
  return (
    <>
      <span className="sm:hidden">{formatRupiahShort(value)}</span>
      <span className="hidden sm:inline">{formatRupiah(value)}</span>
    </>
  );
}
