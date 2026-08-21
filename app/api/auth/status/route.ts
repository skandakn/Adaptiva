import { ok } from "@/lib/api/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistenceMode } from "@/lib/supabase/config";

export async function GET() {
  const mode = persistenceMode();

  if (mode !== "supabase") {
    return ok({
      mode,
      authenticated: mode === "demo",
      user: mode === "demo" ? { email: "demo@adaptiva.local" } : null
    });
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
