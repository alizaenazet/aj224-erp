import { NextResponse, type NextRequest } from "next/server";
import { assertRole } from "@/lib/auth/session";
import { todayWib } from "@/lib/format";
import { ImportFileError } from "@/lib/import/parse";
import { IMPORT_TEMPLATES } from "@/lib/import/registry";
import { runImport } from "@/lib/import/run";
import type { ImportContext, ImportTemplate } from "@/lib/import/types";
import { buildTemplateWorkbook } from "@/lib/import/workbook";
import { createClient } from "@/lib/supabase/server";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type Params = { params: Promise<{ template: string }> };

async function authorize(params: Params["params"]) {
  const { template: key } = await params;
  const template = IMPORT_TEMPLATES[key] as ImportTemplate | undefined;
  if (!template) return { error: NextResponse.json({ error: "Templat tidak ditemukan." }, { status: 404 }) };

  const auth = await assertRole(template.roles);
  if (!auth.ok) return { error: NextResponse.json({ error: auth.error }, { status: 403 }) };

  const ctx: ImportContext = { supabase: await createClient(), profileId: auth.profile.id, today: todayWib() };
  return { template, ctx };
}

/** Template download (UMM-13). */
export async function GET(_request: NextRequest, { params }: Params) {
  const access = await authorize(params);
  if ("error" in access) return access.error;

  const buffer = await buildTemplateWorkbook(access.template, access.ctx);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="${access.template.fileBase}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Check (`mode=check`) or import (`mode=import`) an uploaded file. */
export async function POST(request: NextRequest, { params }: Params) {
  const access = await authorize(params);
  if ("error" in access) return access.error;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const mode = form?.get("mode") === "import" ? "import" : "check";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pilih berkas yang akan diimpor." }, { status: 400 });
  }

  try {
    const result = await runImport({ template: access.template, file, mode, ctx: access.ctx });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ImportFileError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("import failed", access.template.key, error);
    return NextResponse.json({ error: "Impor gagal diproses. Coba lagi." }, { status: 500 });
  }
}
