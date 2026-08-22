import { fail } from "@/lib/api/http";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { demoUserId, persistenceMode } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PersistenceMode = ReturnType<typeof persistenceMode>;

export function usesDemoStore(mode: PersistenceMode) {
  return mode === "demo" || mode === "clerk";
}

export async function requireApiUser() {
  const mode = persistenceMode();

  if (mode === "clerk") {
    const { userId } = await clerkAuth();

    if (!userId) {
      return {
        mode,
        userId: null,
        supabase: null,
        response: fail("Authentication required.", 401, "auth_required")
      };
    }

    return {
      mode,
      userId,
      supabase: null,
      response: null
    };
  }

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
