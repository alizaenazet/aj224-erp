import { NextResponse, type NextRequest } from "next/server";
import { APP_ROLES } from "@/lib/auth/roles";
import { assertRole } from "@/lib/auth/session";
import { isUuid } from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

const LINK_SECONDS = 300;

/**
 * Opens an attachment through a short-lived signed URL (UMM-03). The row is
 * read under RLS, so users who may not see the file get a 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await assertRole(APP_ROLES);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const notFound = NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  if (!isUuid(id)) return notFound;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("attachments")
    .select("bucket, path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (!row) return notFound;

  const download = request.nextUrl.searchParams.has("download") ? row.file_name : false;
  const { data: signed } = await supabase.storage
    .from(row.bucket)
    .createSignedUrl(row.path, LINK_SECONDS, { download });
  if (!signed?.signedUrl) return notFound;

  const response = NextResponse.redirect(signed.signedUrl, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
