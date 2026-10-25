import { NextResponse, type NextRequest } from "next/server";
import { assertRole } from "@/lib/auth/session";
import { EXPORTS, MAX_ROWS } from "@/lib/export/registry";
import { buildWorkbook } from "@/lib/export/xlsx";
import { todayWib } from "@/lib/format";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** .xlsx export of a list with the same filters as the page (UMM-04). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ list: string }> },
) {
  const { list } = await params;
  const definition = EXPORTS[list];
  if (!definition) {
    return NextResponse.json({ error: "Ekspor tidak ditemukan." }, { status: 404 });
  }

  const auth = await assertRole(definition.roles);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { rows, count } = await definition.load(raw);

  const buffer = await buildWorkbook({
    sheetName: definition.sheetName,
    columns: definition.columns,
    rows,
    truncated: count > MAX_ROWS,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="${definition.fileBase}-${todayWib()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
