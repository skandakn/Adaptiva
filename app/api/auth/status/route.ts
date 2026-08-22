import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { ok } from "@/lib/api/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistenceMode } from "@/lib/supabase/config";

export async function GET() {
  const mode = persistenceMode();

  if (mode === "clerk") {
    const { userId } = await clerkAuth();
    const user = userId ? await currentUser() : null;

    return ok({
      mode,
      authenticated: Boolean(userId),
      user: userId
        ? {
            id: userId,
            email: user?.primaryEmailAddress?.emailAddress ?? null
          }
        : null
    });
  }

  if (mode === "demo") {
    return ok({
      mode,
      authenticated: true,
      user: { email: "demo@adaptiva.local" }
    });
  }

  if (mode === "unavailable") {
    return ok({ mode, authenticated: false, user: null });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase!.auth.getUser();

  return ok({
    mode,
    authenticated: Boolean(user),
    user: user ? { id: user.id, email: user.email } : null
  });
}
