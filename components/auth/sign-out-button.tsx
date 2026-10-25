"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function useSignOut() {
  return async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full page load: drops the router cache and any previous pages kept in
    // the DOM, so the next user on this device sees nothing of this session.
    window.location.replace("/auth/login");
  };
}

export function SignOutButton(props: React.ComponentProps<typeof Button>) {
  const signOut = useSignOut();
  return (
    <Button variant="outline" onClick={signOut} {...props}>
      Keluar
    </Button>
  );
}
