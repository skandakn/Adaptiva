import { requireApiUser } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { progressCreateSchema } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (auth.mode === "demo") {
    return ok({ mode: auth.mode, ...demoStore.getProgressSummary() });
  }

  const [progressResult, sessionsResult] = await Promise.all([
    auth.supabase!.from("progress").select("*").eq("user_id", auth.userId!).order("updated_at", { ascending: false }),
    auth.supabase!
      .from("learning_sessions")
      .select("*")
      .eq("user_id", auth.userId!)
      .order("started_at", { ascending: false })
  ]);

  if (progressResult.error || sessionsResult.error) {
    return fail("Could not load progress.", 500, "progress_load_failed");
  }

  return ok({
    mode: auth.mode,
    progress: progressResult.data,
    sessions: sessionsResult.data,
    charts: null
  });
}

export async function POST(request: Request) {
  try {
    const payload = progressCreateSchema.parse(await request.json());
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    if (auth.mode === "demo") {
      const progress = demoStore.saveProgress({
        material_id: payload.material_id ?? null,
        concept: payload.concept,
        status: payload.status,
        mastery_level: payload.mastery_level
      });
      const session = payload.session
        ? demoStore.createSession({
            material_id: payload.material_id ?? null,
            mode: payload.session.mode,
            duration_seconds: payload.session.duration_seconds ?? null,
            completed_at: payload.session.completed ? new Date().toISOString() : null
          })
        : null;
      return ok({ mode: auth.mode, progress, session }, { status: 201 });
    }

    if (payload.material_id) {
      const { data: material } = await auth.supabase!
        .from("learning_materials")
        .select("id")
        .eq("id", payload.material_id)
        .eq("user_id", auth.userId!)
        .maybeSingle();
      if (!material) return fail("Material not found.", 404, "material_not_found");
    }

    const { data: progress, error } = await auth.supabase!
      .from("progress")
      .upsert(
        {
          user_id: auth.userId!,
          material_id: payload.material_id ?? null,
          concept: payload.concept,
          status: payload.status,
          mastery_level: payload.mastery_level
        },
        { onConflict: "user_id,material_id,concept" }
      )
      .select()
      .single();

    if (error) return fail("Could not save progress.", 500, "progress_save_failed");

    let session = null;
    if (payload.session) {
      const { data, error: sessionError } = await auth.supabase!
        .from("learning_sessions")
        .insert({
          user_id: auth.userId!,
          material_id: payload.material_id ?? null,
          mode: payload.session.mode,
          duration_seconds: payload.session.duration_seconds ?? null,
          completed_at: payload.session.completed ? new Date().toISOString() : null
        })
        .select()
        .single();
      if (sessionError) return fail("Could not save learning session.", 500, "session_save_failed");
      session = data;
    }

    return ok({ mode: auth.mode, progress, session }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
