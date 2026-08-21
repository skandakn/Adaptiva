import { fail } from "@/lib/api/http";
import { demoUserId, persistenceMode } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireApiUser() {
  const mode = persistenceMode();

  if (mode === "demo") {
    return {
      mode,
      userId: demoUserId,
      supabase: null,
      response: null
    };
  }

  if (mode === "unavailable") {
    return {
      mode,
      userId: null,
      supabase: null,
      response: fail("Persistence is not configured for this deployment.", 503, "persistence_unavailable")
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase!.auth.getUser();

  if (error || !user) {
    return {
      mode,
      userId: null,
      supabase,
      response: fail("Authentication required.", 401, "auth_required")
    };
  }

  return {
    mode,
    userId: user.id,
    supabase,
    response: null
  };
}
