import "server-only";

import { cache } from "react";
import type { AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

/**
 * Active staff names through list_people() (profiles RLS only lets Super
 * Admin and Direktur read other profiles). Cached per request.
 */
export const listPeople = cache(async (roles?: AppRole[]) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_people", roles ? { p_roles: roles } : {});
  return data ?? [];
});

/** id → full name of active staff; unknown ids are inactive or removed users. */
export async function peopleNames() {
  const people = await listPeople();
  return new Map(people.map((person) => [person.id, person.full_name]));
}
