import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Used by server-side redirects (e.g. a deactivated account) to end the
// session. UI sign-out buttons call supabase.auth.signOut() directly.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/auth/login", request.url);
  if (request.nextUrl.searchParams.get("reason") === "inactive") {
    url.searchParams.set("reason", "inactive");
  }

  return NextResponse.redirect(url);
}
